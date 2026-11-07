import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  public database = inject(Database);
  private router = inject(Router);

  public modoCriarConta = signal(false);
  public nome = '';
  public email = '';
  public pass = '';
  public erro = signal('');
  public sucesso = signal('');

  toggleModo(): void {
    this.modoCriarConta.update((valor) => !valor);
    this.limparFormulario();
  }

  async onSubmit(): Promise<void> {
    this.erro.set('');
    this.sucesso.set('');

    if (!this.email.trim() || !this.pass) {
      this.erro.set('Preencha o e-mail e a senha.');
      return;
    }

    if (this.modoCriarConta()) {
      if (!this.nome.trim()) {
        this.erro.set('Informe o seu nome.');
        return;
      }

      const criado = await this.database.cadastrarCliente({
        nome: this.nome,
        email: this.email,
        pass: this.pass
      });

      if (criado) {
        this.sucesso.set('Conta criada com sucesso! Agora faça login.');
        this.modoCriarConta.set(false);
        this.pass = '';
      } else {
        this.erro.set('Não foi possível criar a conta. O e-mail já pode estar cadastrado.');
      }
      return;
    }

    const logado = await this.database.fazerLogin({
      email: this.email,
      pass: this.pass
    });

    if (logado) {
      this.router.navigate(['/']);
    } else {
      this.erro.set('E-mail ou senha incorretos.');
    }
  }

  limparFormulario(): void {
    this.nome = '';
    this.email = '';
    this.pass = '';
    this.erro.set('');
    this.sucesso.set('');
  }
}
