import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, finalize, map, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Cliente, Filme } from '../models/filme';

@Service()
export class Database {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'ifdb_usuario';

  public filmes = signal<Filme[]>([]);
  public filmeSelecionado = signal<Filme | null>(null);
  public carregandoFilme = signal<boolean>(false);
  public isSaving = signal<boolean>(false);
  public usuarioLogado = signal<Cliente | null>(null);
  public isLoggedIn = computed(() => this.usuarioLogado() !== null);

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      apikey: environment.supabaseKey,
      Authorization: `Bearer ${environment.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    });
  }

  constructor() {
    this.restaurarSessao();
    this.carregarFilmes();
  }

  private restaurarSessao(): void {
    try {
      const salvo = localStorage.getItem(this.storageKey);
      if (salvo) {
        this.usuarioLogado.set(JSON.parse(salvo) as Cliente);
      }
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  cadastrarCliente(cliente: { nome: string; email: string; pass: string }): Observable<unknown> {
    this.isSaving.set(true);

    return this.http
      .post(
        `${environment.supabaseRestUrl}/clientes`,
        {
          nome: cliente.nome.trim(),
          email: cliente.email.trim().toLowerCase(),
          senha: cliente.pass
        },
        { headers: this.headers }
      )
      .pipe(
        tap({ error: (err) => console.error('Erro POST cliente:', err) }),
        finalize(() => this.isSaving.set(false))
      );
  }

  fazerLogin(credenciais: { email: string; pass: string }): Observable<Cliente | null> {
    this.isSaving.set(true);

    const email = credenciais.email.trim().toLowerCase();
    const url =
      `${environment.supabaseRestUrl}/clientes` +
      `?email=ilike.${encodeURIComponent(email)}` +
      `&senha=eq.${encodeURIComponent(credenciais.pass)}` +
      `&select=id,nome,email`;

    return this.http.get<Cliente[]>(url, { headers: this.headers }).pipe(
      map((resultado) => resultado?.[0] ?? null),
      tap((cliente) => {
        if (cliente) {
          this.usuarioLogado.set(cliente);
          localStorage.setItem(this.storageKey, JSON.stringify(cliente));
        }
      }),
      tap({ error: (err) => console.error('Erro GET login:', err) }),
      finalize(() => this.isSaving.set(false))
    );
  }

  logout(): void {
    this.usuarioLogado.set(null);
    localStorage.removeItem(this.storageKey);
  }

  carregarFilmes(): void {
    this.http
      .get<Filme[]>(`${environment.supabaseRestUrl}/filmes?select=*`, { headers: this.headers })
      .subscribe({
        next: (dados) => this.filmes.set(dados),
        error: (err) => console.error('Erro GET filmes:', err)
      });
  }

  carregarFilme(id: number): void {
    this.carregandoFilme.set(true);
    this.filmeSelecionado.set(null);

    this.http
      .get<Filme[]>(`${environment.supabaseRestUrl}/filmes?id=eq.${id}&select=*`, { headers: this.headers })
      .subscribe({
        next: (dados) => {
          this.filmeSelecionado.set(dados?.[0] ?? null);
          this.carregandoFilme.set(false);
        },
        error: (err) => {
          console.error('Erro GET filme:', err);
          this.carregandoFilme.set(false);
        }
      });
  }

  addFilmeSupabase(novoFilme: Omit<Filme, 'id'>): Observable<Filme[]> {
    this.isSaving.set(true);

    return this.http
      .post<Filme[]>(`${environment.supabaseRestUrl}/filmes`, novoFilme, { headers: this.headers })
      .pipe(
        tap((resposta) => {
          if (resposta?.[0]) {
            this.filmes.update((lista) => [...lista, resposta[0]]);
          } else {
            this.carregarFilmes();
          }
        }),
        tap({ error: (err) => console.error('Erro POST filme:', err) }),
        finalize(() => this.isSaving.set(false))
      );
  }

  deleteFilmeSupabase(id: number): Observable<unknown> {
    return this.http
      .delete(`${environment.supabaseRestUrl}/filmes?id=eq.${id}`, { headers: this.headers })
      .pipe(
        tap(() => this.filmes.update((lista) => lista.filter((filme) => filme.id !== id))),
        tap({ error: (err) => console.error('Erro DELETE filme:', err) })
      );
  }
}
