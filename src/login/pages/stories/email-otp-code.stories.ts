import type { Meta, StoryObj } from '@storybook/angular';
import { decorators, KcPageStory } from '../../KcPageStory';

const meta: Meta<KcPageStory> = {
  title: 'login/email-otp-code.ftl',
  component: KcPageStory,
  decorators,
  globals: {
    pageId: 'email-otp-code.ftl',
  },
};

export default meta;
type Story = StoryObj<KcPageStory>;

export const Default: Story = {};

export const PortuguesBr: Story = {
  globals: {
    kcContext: {
      locale: {
        currentLanguageTag: 'pt-BR',
      },
      url: {
        loginAction: '/mock-login-action',
        loginUrl: '/mock-login-url',
      },
    },
  },
};

export const WithOtpError: Story = {
  globals: {
    kcContext: {
      locale: {
        currentLanguageTag: 'pt-BR',
      },
      url: {
        loginAction: '/mock-login-action',
        loginUrl: '/mock-login-url',
      },
      messagesPerField: {
        existsError: (field: string) => field === 'totp',
        get: () => 'Código inválido. Confira o código e tente novamente.',
      },
      message: {
        type: 'error',
        summary: 'Código inválido. Confira o código e tente novamente.',
      },
    },
  },
};
