import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input, 
  signal,
} from '@angular/core';
import { KC_LOGIN_CONTEXT } from '@keycloakify/angular/login/tokens/kc-context';
import type { KcContext } from 'keycloakify/login/KcContext';
import { CenaAsciiLoginComponent } from '../cena-ascii-login.component';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
  }
}

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
  imports: [CenaAsciiLoginComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caju-layout.component.html',
  styleUrl: './caju-layout.component.scss',
})
export class CajuLayoutComponent {
  private readonly kcContext = inject<KcContext>(KC_LOGIN_CONTEXT);

  protected readonly logoEnfamSrc =
  `${import.meta.env.BASE_URL}marca/enfam-vertical-branca-120.webp`;

protected readonly logoEnfamSrcset = [
  `${import.meta.env.BASE_URL}marca/enfam-vertical-branca-120.webp 1x`,
  `${import.meta.env.BASE_URL}marca/enfam-vertical-branca-240.webp 2x`,
].join(', ');

  protected readonly logoMobileSrc = this.urlRecursoTema(
    `${import.meta.env.BASE_URL}marca/enfam-horizontal-174.webp`,
  );

  protected readonly logoMobileSrcset = [
    `${this.urlRecursoTema('marca/enfam-horizontal-174.webp')} 1x`,
    `${this.urlRecursoTema('marca/enfam-horizontal-348.webp')} 2x`,
  ].join(', ');


  protected readonly altoContraste = signal(false);
  protected readonly escalaFonte = signal(1);
  protected readonly vlibrasCarregando = signal(false);

  private vlibrasWidgetInicializado = false;

  private urlRecursoTema(caminho: string): string {
    const resourcesPath = this.kcContext.url?.resourcesPath?.replace(/\/+$/, '');
    const caminhoRelativo = caminho.replace(/^\/+/, '');

    if (!resourcesPath) {
      console.error(
        'kcContext.url.resourcesPath não está disponível; não foi possível montar a URL do recurso:',
        caminhoRelativo,
      );

      return '';
    }

    return `${resourcesPath}/${caminhoRelativo}`;
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
