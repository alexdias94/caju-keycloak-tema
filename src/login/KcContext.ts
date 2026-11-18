import type { ExtendKcContext } from 'keycloakify/login';
import type { KcEnvName, ThemeName } from '../kc.gen';

export type KcContextExtension = {
  themeName: ThemeName;
  properties: Record<KcEnvName, string> & {};
};

export type KcContextExtensionPerPage = {
  'email-otp-code.ftl': {
    url: {
      loginAction: string;
      loginUrl?: string;
    };
    execution?: string;
    message?: {
      type?: string;
      summary?: string;
    };
    messagesPerField: {
      existsError: (field: string) => boolean;
      get: (field: string) => string;
    };
    locale?: {
      currentLanguageTag: string;
    };
  };
};

export type KcContext = ExtendKcContext<
  KcContextExtension,
  KcContextExtensionPerPage
>;