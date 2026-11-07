import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';

@Component({
  selector: 'app-filme-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './filme-form.html'
})
export class FilmeForm {
  public database = inject(Database);
  private router = inject(Router);

  public titulo = '';
  public genero = '';
  public ano: number | null = null;
  public sinopse = '';
  public imagemUrl = '';
  public erro = signal('');

  async salvarFilme(): Promise<void> {
    this.erro.set('');

    if (!this.titulo.trim()) {
      this.erro.set('Informe o título do filme.');
      return;
    }

    if (!this.ano) {
      this.erro.set('Informe o ano de lançamento.');
      return;
    }

    const novoFilme = {
      titulo: this.titulo.trim(),
      genero: this.genero.trim() || 'Geral',
      ano: Number(this.ano),
      sinopse: this.sinopse.trim(),
      imagemUrl: this.imagemUrl.trim()
    };

    const sucesso = await this.database.addFilmeSupabase(novoFilme);

    if (sucesso) {
      this.router.navigate(['/']);
    } else {
      this.erro.set('Não foi possível salvar o filme. Tente novamente.');
    }
  }

  limparFormulario(): void {
    this.titulo = '';
    this.genero = '';
    this.ano = null;
    this.sinopse = '';
    this.imagemUrl = '';
    this.erro.set('');
  }
}
