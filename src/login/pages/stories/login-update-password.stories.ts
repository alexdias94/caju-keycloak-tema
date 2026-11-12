import type { Meta, StoryObj } from '@storybook/angular';
import { decorators, KcPageStory } from '../../KcPageStory';

const meta: Meta<KcPageStory> = {
  title: 'login/login-update-password.ftl',
  component: KcPageStory,
  decorators,
  globals: {
    pageId: 'login-update-password.ftl',
  },
};

export default meta;
type Story = StoryObj<KcPageStory>;

const contextoBase = {
  url: {
    loginAction: '/mock-login-action',
  },
  isAppInitiatedAction: false,
  messagesPerField: {
    existsError: () => false,
    get: () => '',
  },
};

export const Default: Story = {
  globals: {
    kcContext: contextoBase,
  },
};

export const PortuguesBr: Story = {
  globals: {
    kcContext: {
      ...contextoBase,
      locale: {
        currentLanguageTag: 'pt-BR',
      },
    },
  },
};

export const WithPasswordError: Story = {
  globals: {
    kcContext: {
      ...contextoBase,
      messagesPerField: {
        existsError: (field: string) => field === 'password',
        get: (field: string) =>
          field === 'password' ? 'A senha não atende aos requisitos.' : '',
      }
    },
  },
};

export const WithPasswordConfirmError: Story = {
  globals: {
    kcContext: {
      ...contextoBase,
      messagesPerField: {
        existsError: (field: string) => field === 'password-confirm',
        get: (field: string) =>
          field === 'password-confirm' ? 'As senhas não coincidem.' : '',
      },
    },
  },
};

export const WithAllPasswordErrors: Story = {
  globals: {
    kcContext: {
      ...contextoBase,
      message: {
        type: 'error',
        summary: 'Não foi possível atualizar a senha.',
      },
      messagesPerField: {
        existsError: (field: string) =>
          field === 'password' || field === 'password-confirm',
        get: (field: string) => {
          if (field === 'password') {
            return 'A senha não atende aos requisitos.';
          }

          if (field === 'password-confirm') {
            return 'As senhas não coincidem.';
          }

          return '';
        },
      },
    },
  },
};

export const WithServerMessage: Story = {
  globals: {
    kcContext: {
      message: {
        type: 'error',
        summary: 'As senhas não coincidem.',
      },
    },
  },
};
