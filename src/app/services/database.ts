import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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

  async cadastrarCliente(cliente: { nome: string; email: string; pass: string }): Promise<boolean> {
    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.supabaseRestUrl}/clientes`,
          {
            nome: cliente.nome.trim(),
            email: cliente.email.trim().toLowerCase(),
            senha: cliente.pass
          },
          { headers: this.headers }
        )
      );
      return true;
    } catch (err) {
      console.error('Erro POST cliente:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async fazerLogin(credenciais: { email: string; pass: string }): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const email = credenciais.email.trim().toLowerCase();
      const url =
        `${environment.supabaseRestUrl}/clientes` +
        `?email=ilike.${encodeURIComponent(email)}` +
        `&senha=eq.${encodeURIComponent(credenciais.pass)}` +
        `&select=id,nome,email`;

      const resultado = await firstValueFrom(this.http.get<Cliente[]>(url, { headers: this.headers }));
      const cliente = resultado?.[0];
      if (!cliente) {
        return false;
      }

      this.usuarioLogado.set(cliente);
      localStorage.setItem(this.storageKey, JSON.stringify(cliente));
      return true;
    } catch (err) {
      console.error('Erro GET login:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
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

  async addFilmeSupabase(novoFilme: Omit<Filme, 'id'>): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const resposta = await firstValueFrom(
        this.http.post<Filme[]>(`${environment.supabaseRestUrl}/filmes`, novoFilme, { headers: this.headers })
      );

      if (resposta?.[0]) {
        this.filmes.update((lista) => [...lista, resposta[0]]);
      } else {
        this.carregarFilmes();
      }
      return true;
    } catch (err) {
      console.error('Erro POST filme:', err);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteFilmeSupabase(id: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.supabaseRestUrl}/filmes?id=eq.${id}`, { headers: this.headers })
      );
      this.filmes.update((lista) => lista.filter((filme) => filme.id !== id));
      return true;
    } catch (err) {
      console.error('Erro DELETE filme:', err);
      return false;
    }
  }
}
