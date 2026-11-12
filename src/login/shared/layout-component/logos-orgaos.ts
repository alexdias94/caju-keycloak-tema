import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logos das instituições que mantêm a plataforma, nesta ordem: STJ, Enfam e CJF.
 * Os arquivos são servidos a partir de public/marca.
 */
@Component({
  selector: 'app-logos-orgaos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.reduzido]': 'reduzido()' },
  template: `
    <ul [attr.aria-label]="rotulo()">
      <li>
        <img
          class="stj"
          [src]="urlPublica('marca/stj-branca.svg')"
          loading="lazy"
          decoding="async"
          alt="STJ – Superior Tribunal de Justiça"
          width="2477"
          height="932"
        />
      </li>
      <li>
        <img
          class="enfam"
          [src]="urlPublica('marca/enfam-vertical-branca-88.webp')"
          [srcset]="
            urlPublica('marca/enfam-vertical-branca-88.webp') +
            ' 1x, ' +
            urlPublica('marca/enfam-vertical-branca-176.webp') +
            ' 2x'
          "
          loading="lazy"
          decoding="async"
          alt="Enfam – Escola Nacional de Formação e Aperfeiçoamento de Magistrados"
          width="109"
          height="88"
        />
      </li>
      <li>
        <img
          class="jf"
          [src]="urlPublica('marca/justica-federal-horizontal-branca-48.webp')"
          [srcset]="
            urlPublica('marca/justica-federal-horizontal-branca-48.webp') +
            ' 1x, ' +
            urlPublica('marca/justica-federal-horizontal-branca-96.webp') +
            ' 2x'
          "
          loading="lazy"
          decoding="async"
          alt="Justiça Federal – Conselho da Justiça Federal"
          width="274"
          height="48"
        />
      </li>
    </ul>
  `,
  styles: `
    :host {
      display: block;
      --escala: 1;
    }

    :host(.reduzido) {
      --escala: 0.6;
    }

    ul {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px calc(44px * var(--escala) + 4px);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    img {
      display: block;
      width: auto;
    }

    .stj {
      height: calc(48px * var(--escala));
    }

    .enfam {
      height: calc(64px * var(--escala));
    }

    .jf {
      height: calc(34px * var(--escala));
    }

    @media (max-width: 560px) {
      :host(:not(.reduzido)) {
        --escala: 0.7;
      }
    }
  `,
})
export class LogosOrgaos {
  /** true: exibe a versão menor, usada na tela de entrada. */
  readonly reduzido = input(false);
  readonly rotulo = input('Instituições que mantêm a plataforma');

  protected urlPublica(caminho: string): string {
    const base = import.meta.env.BASE_URL;
    return `${base}${caminho.replace(/^\/+/, '')}`;
  }
}
