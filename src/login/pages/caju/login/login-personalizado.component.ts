import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { KC_LOGIN_CONTEXT } from '@keycloakify/angular/login/tokens/kc-context';
import type { I18n } from '@keycloakify/angular/login/i18n';
import { LOGIN_I18N } from '@keycloakify/angular/login/tokens/i18n';
import type { KcContext } from 'keycloakify/login/KcContext';
import { CajuLayoutComponent } from '../../../shared/layout-component/caju-layout.component';

@Component({
  selector: 'app-login-personalizado',
  imports: [CajuLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-personalizado.component.html',
  styleUrl: './login-personalizado.component.scss',
})
export class LoginPersonalizadoComponent {
  readonly kcContext = inject<Extract<KcContext, { pageId: 'login.ftl' }>>(KC_LOGIN_CONTEXT);
  protected readonly i18n = inject<I18n>(LOGIN_I18N);

  protected readonly mostrarSenha = signal(false);
  protected readonly loginEnviado = signal(false);

  protected temErroDeCampo(): boolean {
    return !!this.kcContext.messagesPerField?.existsError('username', 'password');
  }
}
