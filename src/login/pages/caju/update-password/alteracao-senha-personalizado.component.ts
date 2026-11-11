import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { LogoutOtherSessionsComponent } from '@keycloakify/angular/login/components/logout-other-sessions';
import { KC_LOGIN_CONTEXT } from '@keycloakify/angular/login/tokens/kc-context';
import type { I18n } from '@keycloakify/angular/login/i18n';
import { LOGIN_I18N } from '@keycloakify/angular/login/tokens/i18n';
import type { KcContext } from '../../../KcContext';
import { CajuLayoutComponent } from '../../../shared/layout-component/caju-layout.component';

@Component({
  selector: 'app-alteracao-senha',
  imports: [CajuLayoutComponent, LogoutOtherSessionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alteracao-senha-personalizado.component.html',
  styleUrl: './alteracao-senha-personalizado.component.scss',
})
export class AlteracaoSenhaComponent {
  readonly kcContext = inject<
    Extract<KcContext, { pageId: 'login-update-password.ftl' }>
  >(KC_LOGIN_CONTEXT);

  protected readonly i18n = inject<I18n>(LOGIN_I18N);
  protected readonly senhaNova = signal('');
  protected readonly mostrarSenha = signal(false);
  protected readonly mostrarConfirmacao = signal(false);
  protected readonly envioIniciado = signal(false);
  protected readonly erroRequisitos = signal(false);
  protected readonly altoContraste = signal(false);
  protected readonly escalaFonte = signal(1);

  protected aumentarFonte(): void {
    this.escalaFonte.update((valor) => Math.min(1.3, valor + 0.1));
  }

  protected diminuirFonte(): void {
    this.escalaFonte.update((valor) => Math.max(0.8, valor - 0.1));
  }

  protected atualizarSenha(evento: Event): void {
    this.senhaNova.set((evento.target as HTMLInputElement).value);

    if (this.requisitosSenhaAtendidos()) {
      this.erroRequisitos.set(false);
    }
  }

  protected aoEnviar(evento: SubmitEvent): void {
    if (!this.requisitosSenhaAtendidos()) {
      evento.preventDefault();
      this.erroRequisitos.set(true);
      return;
    }

    this.erroRequisitos.set(false);
    this.envioIniciado.set(true);
  }

  private requisitosSenhaAtendidos(): boolean {
    return (
      this.senhaTemOitoCaracteres() &&
      this.senhaTemNumero() &&
      this.senhaTemMaiuscula() &&
      this.senhaTemMinuscula() &&
      this.senhaTemEspecial()
    );
  }

  protected temErroSenha(): boolean {
    return this.kcContext.messagesPerField.existsError('password');
  }

  protected temErroConfirmacao(): boolean {
    return this.kcContext.messagesPerField.existsError('password-confirm');
  }

  protected senhaTemOitoCaracteres(): boolean {
    return [...this.senhaNova()].length >= 8;
  }

  protected senhaTemNumero(): boolean {
    return /\p{N}/u.test(this.senhaNova());
  }

  protected senhaTemMaiuscula(): boolean {
    return /\p{Lu}/u.test(this.senhaNova());
  }

  protected senhaTemMinuscula(): boolean {
    return /\p{Ll}/u.test(this.senhaNova());
  }

  protected senhaTemEspecial(): boolean {
    return /[\p{P}\p{S}]/u.test(this.senhaNova());
  }
}

