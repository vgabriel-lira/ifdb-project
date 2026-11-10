import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, min, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';

interface FilmeFormData {
  titulo: string;
  genero: string;
  ano: number;
  sinopse: string;
  imagemUrl: string;
}

const FILME_INICIAL: FilmeFormData = {
  titulo: '',
  genero: '',
  ano: new Date().getFullYear(),
  sinopse: '',
  imagemUrl: ''
};

@Component({
  selector: 'app-filme-form',
  standalone: true,
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './filme-form.html'
})
export class FilmeForm {
  public database = inject(Database);
  private router = inject(Router);

  public erro = signal('');

  protected readonly filmeModel = signal<FilmeFormData>({ ...FILME_INICIAL });

  protected readonly filmeForm = form(
    this.filmeModel,
    (p) => {
      required(p.titulo, { message: 'Informe o título do filme.' });
      required(p.ano, { message: 'Informe o ano de lançamento.' });
      min(p.ano, 1888, { message: 'O ano deve ser maior ou igual a 1888.' });
    },
    {
      submission: {
        action: (f) =>
          new Promise<void>((resolve) => {
            this.erro.set('');

            const dados = this.filmeModel();
            const novoFilme = {
              titulo: dados.titulo.trim(),
              genero: dados.genero.trim() || 'Geral',
              ano: Number(dados.ano),
              sinopse: dados.sinopse.trim(),
              imagemUrl: dados.imagemUrl.trim()
            };

            this.database.addFilmeSupabase(novoFilme).subscribe({
              next: () => {
                f().reset({ ...FILME_INICIAL });
                this.router.navigate(['/']);
              },
              error: () => {
                this.erro.set('Não foi possível salvar o filme. Tente novamente.');
              },
              complete: () => resolve()
            });
          })
      }
    }
  );

  limparFormulario(): void {
    this.filmeForm().reset({ ...FILME_INICIAL });
    this.erro.set('');
  }
}
