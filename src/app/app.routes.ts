import { Routes } from '@angular/router';
import { FilmeDetail } from './components/filme-detail/filme-detail';
import { FilmeForm } from './components/filme-form/filme-form';
import { FilmeList } from './components/filme-list/filme-list';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: FilmeList },
  { path: 'login', component: Login },
  { path: 'novo-filme', component: FilmeForm, canActivate: [authGuard] },
  { path: 'filme/:id', component: FilmeDetail },
  { path: '**', redirectTo: '' }
];
