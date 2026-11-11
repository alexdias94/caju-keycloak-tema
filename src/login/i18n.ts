import { i18nBuilder } from '@keycloakify/angular/login';
import type { ThemeName } from '../kc.gen';

const { getI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    'pt-BR': {
      username: 'CPF, passaporte ou e-mail',
      usernameOrEmail: 'CPF, passaporte ou e-mail',
      email: 'CPF, passaporte ou e-mail',
      backToLogin: 'Voltar para o login',
      otpTitle: '2º Fator de Autenticação',
      otpInstruction: 'Digite o código enviado para o seu e-mail.',
      otpCodeLegend: 'Digite o código de 6 dígitos',
      otpCodeGroupLabel: 'Código de verificação',
      otpDigit: 'Dígito',
      otpOfSix: 'de 6',
      otpIncompleteError: 'Digite os 6 dígitos do código recebido por e-mail.',
      otpTrustDevice: 'Confiar neste computador por 8 horas',
      otpValidate: 'Validar acesso',
      otpSending: 'Enviando…',
      otpResend: 'Solicitar novo código',
    },
    en: {
      username: 'CPF, passport, or email',
      usernameOrEmail: 'CPF, passport, or email',
      email: 'CPF, passport, or email',
      backToLogin: 'Back to login',
      otpTitle: 'Two-factor authentication',
      otpInstruction: 'Enter the code sent to your email.',
      otpCodeLegend: 'Enter the 6-digit code',
      otpCodeGroupLabel: 'Verification code',
      otpDigit: 'Digit',
      otpOfSix: 'of 6',
      otpIncompleteError: 'Enter the 6-digit code sent to your email.',
      otpTrustDevice: 'Trust this computer for 8 hours',
      otpValidate: 'Verify access',
      otpSending: 'Sending…',
      otpResend: 'Request a new code',
    },
    es: {
      username: 'CPF, pasaporte o correo electrónico',
      usernameOrEmail: 'CPF, pasaporte o correo electrónico',
      email: 'CPF, pasaporte o correo electrónico',
      backToLogin: 'Volver al inicio de sesión',
      otpTitle: 'Segundo factor de autenticación',
      otpInstruction: 'Introduce el código enviado a tu correo electrónico.',
      otpCodeLegend: 'Introduce el código de 6 dígitos',
      otpCodeGroupLabel: 'Código de verificación',
      otpDigit: 'Dígito',
      otpOfSix: 'de 6',
      otpIncompleteError: 'Introduce los 6 dígitos del código enviado por correo electrónico.',
      otpTrustDevice: 'Confiar en este equipo durante 8 horas',
      otpValidate: 'Validar acceso',
      otpSending: 'Enviando…',
      otpResend: 'Solicitar un nuevo código',
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { getI18n, type I18n };
