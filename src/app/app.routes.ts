import { Routes } from '@angular/router';
import { FilmeDetail } from './components/filme-detail/filme-detail';
import { FilmeForm } from './components/filme-form/filme-form';
import { FilmeList } from './components/filme-list/filme-list';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: FilmeList, title: 'IFDb - Catálogo de Filmes' },
  { path: 'login', component: Login, title: 'Entrar | IFDb' },
  { path: 'novo-filme', component: FilmeForm, canActivate: [authGuard], title: 'Novo filme | IFDb' },
  { path: 'filme/:id', component: FilmeDetail, title: 'Detalhes do filme | IFDb' },
  { path: '**', redirectTo: '' }
];
