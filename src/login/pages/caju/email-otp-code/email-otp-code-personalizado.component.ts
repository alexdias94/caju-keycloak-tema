import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { KC_LOGIN_CONTEXT } from '@keycloakify/angular/login/tokens/kc-context';
import type { I18n } from '@keycloakify/angular/login/i18n';
import { LOGIN_I18N } from '@keycloakify/angular/login/tokens/i18n';
import type { KcContext } from '../../../KcContext';
import { CajuLayoutComponent } from '../../../shared/layout-component/caju-layout.component';

@Component({
  selector: 'app-email-otp-code',
  imports: [CajuLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-otp-code-personalizado.component.html',
  styleUrl: './email-otp-code-personalizado.component.scss',
})
export class EmailOtpCodeComponent {
  readonly kcContext = inject<
    Extract<KcContext, { pageId: 'email-otp-code.ftl' }>
  >(KC_LOGIN_CONTEXT);

  protected readonly i18n = inject<I18n>(LOGIN_I18N);
  protected readonly otp = signal<string[]>(Array(6).fill(''));
  protected readonly envioIniciado = signal(false);
  protected readonly erroLocal = signal(false);
  protected readonly confiarDispositivo = signal(false);

  protected temErroOtp(): boolean {
    return (
      this.kcContext.messagesPerField.existsError('totp') ||
      this.kcContext.messagesPerField.existsError('otp')
    );
  }

  protected mensagemErroOtp(): string {
    return (
      this.kcContext.messagesPerField.get('totp') ||
      this.kcContext.messagesPerField.get('otp') ||
      ''
    );
  }

  protected aoDigitar(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '');

    if (!digitos) {
      this.otp.update((atual) => {
        const proximo = [...atual];
        proximo[indice] = '';
        return proximo;
      });
      return;
    }

    this.distribuirDigitos(digitos, indice);
  }

  protected aoColar(indice: number, evento: ClipboardEvent): void {
    const texto = evento.clipboardData?.getData('text') ?? '';
    const digitos = texto.replace(/\D/g, '');

    if (!digitos) return;

    evento.preventDefault();
    this.distribuirDigitos(digitos, indice);
  }

  protected aoPressionarTecla(indice: number, evento: KeyboardEvent): void {
    const input = evento.target as HTMLInputElement;

    if (evento.key === 'ArrowLeft' && indice > 0) {
      evento.preventDefault();
      this.focarCampo(indice - 1);
      return;
    }

    if (evento.key === 'ArrowRight' && indice < 5) {
      evento.preventDefault();
      this.focarCampo(indice + 1);
      return;
    }

    if (evento.key === 'Backspace') {
      evento.preventDefault();

      if (input.value) {
        this.otp.update((atual) => {
          const proximo = [...atual];
          proximo[indice] = '';
          return proximo;
        });
      } else if (indice > 0) {
        this.otp.update((atual) => {
          const proximo = [...atual];
          proximo[indice - 1] = '';
          return proximo;
        });
        this.focarCampo(indice - 1);
      }
    }
  }

  protected aoEnviar(evento: SubmitEvent): void {
    const acionador = evento.submitter as HTMLButtonElement | null;
    const nomeAcionador = acionador?.name;

    // Reenvio e retorno reiniciam o fluxo e não dependem de um OTP preenchido.
    if (nomeAcionador === 'resendCode' || nomeAcionador === 'execution') {
      this.envioIniciado.set(true);
      return;
    }

    const codigoCompleto = this.otp().length === 6 &&
      this.otp().every((digito) => /^\d$/.test(digito));

    if (!codigoCompleto) {
      evento.preventDefault();
      this.erroLocal.set(true);
      this.focarCampo(this.otp().findIndex((digito) => !digito));
      return;
    }

    this.erroLocal.set(false);
    this.envioIniciado.set(true);
  }

  private distribuirDigitos(digitos: string, indiceInicial: number): void {
    const caracteres = digitos.slice(0, 6 - indiceInicial).split('');

    this.otp.update((atual) => {
      const proximo = [...atual];

      caracteres.forEach((digito, deslocamento) => {
        proximo[indiceInicial + deslocamento] = digito;
      });

      return proximo;
    });

    this.erroLocal.set(false);
    this.focarCampo(Math.min(indiceInicial + caracteres.length, 5));
  }

  private focarCampo(indice: number): void {
    if (indice < 0) return;

    const campo = document.querySelector<HTMLInputElement>(
      `[data-otp-index="${indice}"]`,
    );

    campo?.focus();
  }
}
