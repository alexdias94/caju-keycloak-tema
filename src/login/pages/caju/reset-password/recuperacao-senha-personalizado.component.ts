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
  selector: 'app-recuperacao-senha',
  imports: [CajuLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recuperacao-senha-personalizado.component.html',
  styleUrl: './recuperacao-senha-personalizado.component.scss',
})
export class RecuperacaoSenhaComponent {
  readonly kcContext = inject<
    Extract<KcContext, { pageId: 'login-reset-password.ftl' }>
  >(KC_LOGIN_CONTEXT);

  protected readonly i18n = inject<I18n>(LOGIN_I18N);
  protected readonly envioIniciado = signal(false);

  protected temErroDeIdentificador(): boolean {
    return this.kcContext.messagesPerField.existsError('username');
  }
}
