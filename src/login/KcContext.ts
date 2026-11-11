import type { ExtendKcContext } from 'keycloakify/login';
import type { KcEnvName, ThemeName } from '../kc.gen';

export type KcContextExtension = {
  themeName: ThemeName;
  properties: Record<KcEnvName, string> & {};
};

export type KcContextExtensionPerPage = {
  // Here you can declare additional properties on the KcContext
  // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
};

type EmailOtpKcContext = {
  pageId: 'email-otp-code.ftl';
  url: {
    loginAction: string;
    loginUrl?: string;
  };
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

type DefaultKcContext = ExtendKcContext<
  KcContextExtension,
  KcContextExtensionPerPage
>;

export type KcContext = DefaultKcContext | EmailOtpKcContext;
