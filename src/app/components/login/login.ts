import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Database } from '../../services/database';

interface LoginFormData {
  nome: string;
  email: string;
  pass: string;
}

const LOGIN_INICIAL: LoginFormData = {
  nome: '',
  email: '',
  pass: ''
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormRoot, FormField, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  public database = inject(Database);
  private router = inject(Router);

  public modoCriarConta = signal(false);
  public erro = signal('');
  public sucesso = signal('');

  protected readonly loginModel = signal<LoginFormData>({ ...LOGIN_INICIAL });

  protected readonly loginForm = form(
    this.loginModel,
    (p) => {
      required(p.nome, {
        message: 'Informe o seu nome.',
        when: () => this.modoCriarConta()
      });
      required(p.email, { message: 'Preencha o e-mail.' });
      email(p.email, { message: 'Informe um e-mail válido.' });
      required(p.pass, { message: 'Preencha a senha.' });
    },
    {
      submission: {
        action: (f) =>
          new Promise<void>((resolve) => {
            this.erro.set('');
            this.sucesso.set('');

            const dados = this.loginModel();

            if (this.modoCriarConta()) {
              this.database
                .cadastrarCliente({
                  nome: dados.nome,
                  email: dados.email,
                  pass: dados.pass
                })
                .subscribe({
                  next: () => {
                    this.sucesso.set('Conta criada com sucesso! Agora faça login.');
                    this.modoCriarConta.set(false);
                    f().reset({ ...LOGIN_INICIAL });
                  },
                  error: () => {
                    this.erro.set('Não foi possível criar a conta. O e-mail já pode estar cadastrado.');
                  },
                  complete: () => resolve()
                });

              return;
            }

            this.database
              .fazerLogin({
                email: dados.email,
                pass: dados.pass
              })
              .subscribe({
                next: (cliente) => {
                  if (cliente) {
                    this.router.navigate(['/']);
                  } else {
                    this.erro.set('E-mail ou senha incorretos.');
                  }
                },
                error: () => {
                  this.erro.set('E-mail ou senha incorretos.');
                },
                complete: () => resolve()
              });
          })
      }
    }
  );

  toggleModo(): void {
    this.modoCriarConta.update((valor) => !valor);
    this.loginForm().reset({ ...LOGIN_INICIAL });
    this.erro.set('');
    this.sucesso.set('');
  }
}
