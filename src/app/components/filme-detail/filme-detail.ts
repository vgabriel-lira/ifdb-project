import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';

@Component({
  selector: 'app-filme-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './filme-detail.html'
})
export class FilmeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public database = inject(Database);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.database.carregarFilme(id);
      }
    });
  }

  removerFilme(id: number): void {
    if (!confirm('Deseja excluir este filme do catálogo?')) {
      return;
    }

    this.database.deleteFilmeSupabase(id).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        alert('Não foi possível excluir o filme. Tente novamente.');
      }
    });
  }
}
