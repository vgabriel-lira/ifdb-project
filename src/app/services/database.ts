import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Filme } from '../models/filme';

@Injectable({
  providedIn: 'root'
})
export class Database {
  private readonly http = inject(HttpClient);

  public filmes = signal<Filme[]>([]);
  public filmeSelecionado = signal<Filme | null>(null);
  public carregandoFilme = signal<boolean>(false);
  public isSaving = signal<boolean>(false);

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      apikey: environment.supabaseKey,
      Authorization: `Bearer ${environment.supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    });
  }

  constructor() {
    this.carregarFilmes();
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
