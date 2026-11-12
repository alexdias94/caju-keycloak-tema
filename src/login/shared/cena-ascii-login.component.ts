import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MotorAscii, type PosicaoCaju, type Tela } from './cena-ascii.motor';

@Component({
  selector: 'app-cena-ascii-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #tela aria-hidden="true"></canvas>

    @if (!movimentoReduzido()) {
      <button
        type="button"
        class="pausar"
        (click)="alternarPausa()"
        [attr.aria-pressed]="pausada()"
      >
        <span aria-hidden="true">{{ pausada() ? '▶' : 'Ⅱ' }}</span>
        <span class="sr-only">
          {{ pausada() ? 'Retomar' : 'Pausar' }} animação do banner
        </span>
      </button>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }

    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .pausar {
      position: absolute;
      right: 16px;
      bottom: 16px;
      z-index: 2;
      display: grid;
      width: 36px;
      height: 36px;
      place-items: center;
      border: 1px solid rgb(255 255 255 / 45%);
      border-radius: 50%;
      background: rgb(15 28 46 / 65%);
      color: #fff;
      cursor: pointer;
      pointer-events: auto;
    }

    .pausar:focus-visible {
      outline: 3px solid #fff;
      outline-offset: 3px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      clip-path: inset(50%);
    }
  `,
})
export class CenaAsciiLoginComponent {
  readonly centralizada = input(true);
  readonly caju = input<PosicaoCaju>('haste');

  protected readonly movimentoReduzido = signal(false);
  protected readonly pausada = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tela = viewChild.required<ElementRef<HTMLCanvasElement>>('tela');

  private motor?: MotorAscii;
  private observadorTamanho?: ResizeObserver;
  private observadorVisibilidade?: IntersectionObserver;
  private mediaMovimento?: MediaQueryList;
  private quadro: number | null = null;
  private anterior = 0;
  private visivel = true;
  private destruido = false;

  private readonly aoMudarMovimento = (evento: MediaQueryListEvent): void => {
    this.movimentoReduzido.set(evento.matches);
    this.montarMotor();
    this.sincronizarAnimacao();
  };

  private readonly aoMudarVisibilidade = (): void => {
    this.sincronizarAnimacao();
  };

  constructor() {
    this.destroyRef.onDestroy(() => this.limpar());
    afterNextRender(() => this.iniciar());
  }

  protected alternarPausa(): void {
    this.pausada.update((valor) => !valor);
    this.sincronizarAnimacao();
  }

  private iniciar(): void {
    this.mediaMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.movimentoReduzido.set(this.mediaMovimento.matches);
    this.mediaMovimento.addEventListener('change', this.aoMudarMovimento);

    this.observadorTamanho = new ResizeObserver(() => {
      this.montarMotor();
      this.sincronizarAnimacao();
    });
    this.observadorTamanho.observe(this.host.nativeElement);

    this.observadorVisibilidade = new IntersectionObserver(([entrada]) => {
      this.visivel = entrada.isIntersecting;
      this.sincronizarAnimacao();
    });
    this.observadorVisibilidade.observe(this.host.nativeElement);

    document.addEventListener('visibilitychange', this.aoMudarVisibilidade);

    this.montarMotor();
    this.sincronizarAnimacao();
  }

  private montarMotor(): void {
    if (this.destruido) return;

    const { clientWidth: largura, clientHeight: altura } = this.host.nativeElement;
    if (!largura || !altura) return;

    const canvas = this.tela().nativeElement;
    const comoTela = (elemento: HTMLCanvasElement): Tela =>
      elemento as unknown as Tela;

    this.motor = new MotorAscii(
      comoTela(canvas),
      (w, h) =>
        comoTela(Object.assign(document.createElement('canvas'), { width: w, height: h })),
      {
        centralizada: this.centralizada(),
        movimentoReduzido: this.movimentoReduzido(),
        caju: this.caju(),
      },
    );

    if (this.motor.ajustar(largura, altura, window.devicePixelRatio || 1)) {
      this.motor.desenhar();
    }
  }

  private sincronizarAnimacao(): void {
    const deveAnimar =
      !this.destruido &&
      !this.pausada() &&
      !this.movimentoReduzido() &&
      this.visivel &&
      !document.hidden &&
      !!this.motor;

    if (!deveAnimar) {
      if (this.quadro !== null) cancelAnimationFrame(this.quadro);
      this.quadro = null;
      return;
    }

    if (this.quadro === null) {
      this.anterior = performance.now();
      this.quadro = requestAnimationFrame(this.animar);
    }
  }

  private readonly animar = (agora: number): void => {
    this.quadro = null;

    if (
      this.destruido ||
      this.pausada() ||
      this.movimentoReduzido() ||
      !this.visivel ||
      document.hidden ||
      !this.motor
    ) {
      return;
    }

    const dt = Math.min(0.1, (agora - this.anterior) / 1000);
    this.anterior = agora;
    this.motor.avancar(dt);
    this.motor.desenhar();
    this.quadro = requestAnimationFrame(this.animar);
  };

  private limpar(): void {
    this.destruido = true;

    if (this.quadro !== null) cancelAnimationFrame(this.quadro);
    this.observadorTamanho?.disconnect();
    this.observadorVisibilidade?.disconnect();
    this.mediaMovimento?.removeEventListener('change', this.aoMudarMovimento);
    document.removeEventListener('visibilitychange', this.aoMudarVisibilidade);

    this.quadro = null;
    this.motor = undefined;
  }
}
