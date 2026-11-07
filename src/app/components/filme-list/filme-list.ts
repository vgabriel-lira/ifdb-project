import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';
import { FilmeCard } from '../filme-card/filme-card';

@Component({
  selector: 'app-filme-list',
  standalone: true,
  imports: [NgClass, RouterLink, FilmeCard],
  templateUrl: './filme-list.html'
})
export class FilmeList {
  public database = inject(Database);
  private router = inject(Router);

  public categoriaSelecionada = signal('Todos');
  public busca = signal('');

  public categorias = computed(() => {
    const nomes = new Set<string>();

    for (const filme of this.database.filmes()) {
      for (const genero of (filme.genero ?? '').split('/')) {
        const nome = genero.trim();
        if (nome) {
          nomes.add(nome);
        }
      }
    }

    return ['Todos', ...Array.from(nomes).sort((a, b) => a.localeCompare(b))];
  });

  public filmesFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const categoria = this.categoriaSelecionada();

    return this.database.filmes().filter((filme) => {
      const generos = (filme.genero ?? '').split('/').map((g) => g.trim());
      const combinaCategoria = categoria === 'Todos' || generos.includes(categoria);
      const combinaBusca = !termo || filme.titulo.toLowerCase().includes(termo);
      return combinaCategoria && combinaBusca;
    });
  });

  public destaque = computed(() => this.filmesFiltrados()[0] ?? null);

  selecionarCategoria(categoria: string): void {
    this.categoriaSelecionada.set(categoria);
    this.rolarParaCatalogo();
  }

  atualizarBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
  }

  limparFiltros(): void {
    this.busca.set('');
    this.categoriaSelecionada.set('Todos');
  }

  irParaTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  abrirFilme(id: number): void {
    this.router.navigate(['/filme', id]);
  }

  async removerFilme(id: number): Promise<void> {
    if (!confirm('Deseja excluir este filme do catálogo?')) {
      return;
    }

    const sucesso = await this.database.deleteFilmeSupabase(id);
    if (!sucesso) {
      alert('Não foi possível excluir o filme. Tente novamente.');
    }
  }

  sair(): void {
    this.database.logout();
  }

  private rolarParaCatalogo(): void {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
