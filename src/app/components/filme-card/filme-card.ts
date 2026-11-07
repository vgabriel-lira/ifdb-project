import { Component, input, numberAttribute, output } from '@angular/core';

@Component({
  selector: 'app-filme-card',
  standalone: true,
  templateUrl: './filme-card.html'
})
export class FilmeCard {
  titulo = input.required<string>();
  genero = input('');
  ano = input(2026, { transform: numberAttribute });
  imagemUrl = input('');
  canDelete = input(false);

  selected = output<void>();
  deleteRequested = output<void>();
}
