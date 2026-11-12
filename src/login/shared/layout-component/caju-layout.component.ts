import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { CenaAsciiLoginComponent } from '../cena-ascii-login.component';
import { LogosOrgaos } from './logos-orgaos';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

type PosicaoCaju = 'haste' | 'lente';

let vlibrasScriptPromise: Promise<void> | undefined;

function carregarScriptVlibras(): Promise<void> {
  if (window.VLibras) {
    return Promise.resolve();
  }

  if (vlibrasScriptPromise) {
    return vlibrasScriptPromise;
  }

  vlibrasScriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.getElementById(
      'vlibras-plugin-script',
    ) as HTMLScriptElement | null;

    const aoCarregar = (): void => {
      if (window.VLibras) {
        resolve();
      } else {
        vlibrasScriptPromise = undefined;
        reject(new Error('O script do VLibras carregou, mas não inicializou.'));
      }
    };

    const aoFalhar = (): void => {
      vlibrasScriptPromise = undefined;
      reject(new Error('Não foi possível carregar o VLibras.'));
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'vlibras-plugin-script';
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', aoCarregar, { once: true });
    script.addEventListener('error', aoFalhar, { once: true });
  });

  return vlibrasScriptPromise;
}

@Component({
  selector: 'app-layout-autenticacao',
  imports: [CenaAsciiLoginComponent, LogosOrgaos],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caju-layout.component.html',
  styleUrl: './caju-layout.component.scss',
})
export class CajuLayoutComponent {
  /** Define se CAJU aparece gravado na haste ou destacado na lente. */
  readonly caju = input<PosicaoCaju>('lente');

  protected readonly altoContraste = signal(false);
  protected readonly escalaFonte = signal(1);
  protected readonly vlibrasCarregando = signal(false);

  private vlibrasWidgetInicializado = false;

  /** Monta a URL de um arquivo de public/ respeitando a base configurada pelo Vite. */
  protected urlPublica(caminho: string): string {
    const base = import.meta.env.BASE_URL;
    return `${base}${caminho.replace(/^\/+/, '')}`;
  }

  protected ativarVlibras(): void {
    if (this.vlibrasCarregando()) {
      return;
    }

    if (this.vlibrasWidgetInicializado) {
      this.acionarBotaoVlibras();
      return;
    }

    this.vlibrasCarregando.set(true);

    carregarScriptVlibras()
      .then(() => {
        if (!window.VLibras) {
          throw new Error('O script do VLibras não inicializou.');
        }

        new window.VLibras.Widget('https://vlibras.gov.br/app');
        this.vlibrasWidgetInicializado = true;
        this.acionarBotaoVlibras();
      })
      .catch((erro: unknown) => {
        console.error('Falha ao iniciar o VLibras:', erro);
      })
      .finally(() => {
        this.vlibrasCarregando.set(false);
      });
  }

  private acionarBotaoVlibras(tentativas = 30): void {
    const botao = document.querySelector<HTMLElement>('[vw-access-button]');

    if (botao) {
      botao.click();
      return;
    }

    if (tentativas > 0) {
      window.setTimeout(
        () => this.acionarBotaoVlibras(tentativas - 1),
        100,
      );
    }
  }

  protected alternarAltoContraste(): void {
    this.altoContraste.update((valor) => !valor);
  }

  protected aumentarFonte(): void {
    this.escalaFonte.update((valor) => Math.min(1.375, valor + 0.125));
  }

  protected diminuirFonte(): void {
    this.escalaFonte.update((valor) => Math.max(0.875, valor - 0.125));
  }
}
