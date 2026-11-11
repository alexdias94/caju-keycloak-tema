import { getDefaultPageComponent, type KcPage } from '@keycloakify/angular/login';
import { UserProfileFormFieldsComponent } from '@keycloakify/angular/login/components/user-profile-form-fields';
import { TemplateComponent } from '@keycloakify/angular/login/template';
import type { ClassKey } from 'keycloakify/login';
import type { KcContext } from './KcContext';

export const classes = {} satisfies Partial<Record<ClassKey, string>>;
export const doUseDefaultCss = true;
export const doMakeUserConfirmPassword = true;

export async function getKcPage(pageId: KcContext['pageId']): Promise<KcPage> {
 const PageComponent = await (async () => {
    switch (pageId) {
      case 'login.ftl':
        return (
          await import('./pages/caju/login/login-personalizado.component')
        ).LoginPersonalizadoComponent;

      case 'login-reset-password.ftl':
        return (
          await import(
            './pages/caju/reset-password/recuperacao-senha-personalizado.component'
          )
        ).RecuperacaoSenhaComponent;

      case 'login-update-password.ftl':
        return (
          await import(
            './pages/caju/update-password/alteracao-senha-personalizado.component'
          )
        ).AlteracaoSenhaComponent;

       case 'email-otp-code.ftl':
        return (
          await import(
            './pages/caju/email-otp-code/email-otp-code-personalizado.component'
          )
        ).EmailOtpCodeComponent;  

      default:
        return getDefaultPageComponent(pageId);
    }
  })();

  return {
    PageComponent,
    TemplateComponent,
    UserProfileFormFieldsComponent,
    doMakeUserConfirmPassword,
    doUseDefaultCss,
    classes,
  };
}
