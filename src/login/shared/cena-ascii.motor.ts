/**
 * Motor de desenho da lupa em arte ASCII.
 *
 * Não depende do DOM: recebe um canvas (da página ou OffscreenCanvas) e uma função para criar o
 * canvas do atlas. Assim o mesmo código roda no Web Worker (fora da thread principal) e, quando
 * o navegador não tem OffscreenCanvas, na própria página.
 *
 * A cena é calculada célula a célula numa grade de caracteres:
 * - fora da lente, caracteres sem ordem, com zonas de luz e sombra;
 * - aro e cabo dourados com sombreamento por iluminação (escala de caracteres do escuro ao claro);
 * - dentro da lente, na mesma grade, o texto do art. 5º legível, com palavras principais em
 *   negrito; o vidro tem reflexo e borda mais clara;
 * - sombra da lupa sobre o fundo, com um ponto de luz concentrada no meio da sombra do vidro;
 * - ao abrir, os caracteres aparecem embaralhados e vão se fixando até formar a imagem.
 */

// Os tipos do DOM (HTMLCanvasElement) não existem dentro do worker. O motor usa só a parte da API
// que o canvas da página e o OffscreenCanvas têm em comum, descrita pelos tipos do OffscreenCanvas.
export type Tela = OffscreenCanvas;
type Contexto = OffscreenCanvasRenderingContext2D;

export interface OpcoesCena {
  /** true: lupa no centro; false: à direita no desktop, deixando o texto do banner livre. */
  centralizada: boolean;
  movimentoReduzido: boolean;
}

// Texto lido pela lente: art. 5º da Constituição Federal (domínio público)
const TEXTO =
  'Art. 5º Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos ' +
  'estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à ' +
  'propriedade, nos termos seguintes: I - homens e mulheres são iguais em direitos e obrigações; II - ninguém será ' +
  'obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei; XXXV - a lei não excluirá da apreciação ' +
  'do Poder Judiciário lesão ou ameaça a direito; LXXVIII - a todos, no âmbito judicial e administrativo, são ' +
  'assegurados a razoável duração do processo e os meios que garantam a celeridade de sua tramitação. ';
// Escala de densidade, do vazio ao mais denso
const RAMPA = ' .:;i1tfLCG08@';
// Fora da lente: caracteres sem ordem
const CAOS = '0123456789§¶{}[]<>/\\|+=*#%&$~^ΣΔΩπλ∂∫≈≠abcdefghijklmnopqrstuvwxyzXYZ';
const CARACTERES = [...new Set([...TEXTO, ...RAMPA, ...CAOS])];
const INDICE = new Map(CARACTERES.map((c, i) => [c, i]));
// Palavras em negrito dentro da lente: marca, no texto, as posições que pertencem a elas
const DESTAQUES = new Set([
  'iguais',
  'lei',
  'vida',
  'liberdade',
  'igualdade',
  'segurança',
  'direito',
  'direitos',
  'poder',
  'judiciário',
  'razoável',
  'duração',
  'processo',
  'celeridade',
  'inviolabilidade',
]);
const EM_NEGRITO = new Uint8Array(TEXTO.length);
for (const m of TEXTO.matchAll(/\p{L}+/gu)) {
  if (DESTAQUES.has(m[0].toLowerCase())) EM_NEGRITO.fill(1, m.index!, m.index! + m[0].length);
}

// Paletas (escuro → claro): texto do fundo, texto visto pela lente, metal dourado e negrito
const NIVEIS = 10;
const PALETAS = [
  ['#26344a', '#34445c', '#4a5a73', '#6f7f97', '#a9b5c7'],
  ['#5b6f8f', '#8ea2c1', '#c4d1e4', '#eef3fb', '#ffffff'],
  ['#3b311a', '#6e5d2e', '#a88f4c', '#cfb163', '#f1e3b8', '#fffaf0'],
  ['#6e5d2e', '#a88f4c', '#cfb163', '#e6cb7e', '#f6e7bd'],
];
const NEGRITO = 3;
const FAMILIA = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

function interpolar(cores: string[], t: number): string {
  const x = Math.min(0.9999, Math.max(0, t)) * (cores.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = parseInt(cores[i].slice(1), 16);
  const b = parseInt(cores[i + 1].slice(1), 16);
  const canal = (s: number) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return `rgb(${canal(16)},${canal(8)},${canal(0)})`;
}

function suave(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// número pseudoaleatório estável por célula (0..1)
function ruido(a: number, b: number, c: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

export class MotorAscii {
  private readonly ctx: Contexto;
  private cw = 0;
  private ch = 0;
  private cols = 0;
  private linhas = 0;
  private dpr = 1;
  private lw = 0;
  private lh = 0;
  private atlas: Tela | null = null;
  private atrasos = new Float32Array(0);
  private tamanhoAtlas = 0;

  private tempo = 0;
  private formacao: number;
  private luzX = -0.55;
  private luzY = -0.65;
  private alvoLuzX = -0.55;
  private alvoLuzY = -0.65;

  constructor(
    private readonly tela: Tela,
    private readonly criarTela: (largura: number, altura: number) => Tela,
    private readonly opcoes: OpcoesCena,
  ) {
    const ctx = tela.getContext('2d') as Contexto | null;
    if (!ctx) throw new Error('Canvas 2D indisponível');
    this.ctx = ctx;
    this.formacao = opcoes.movimentoReduzido ? 1 : 0;
  }

  /** Atlas: uma linha por (paleta, nível), uma coluna por caractere. */
  private montarAtlas(tamanho: number): void {
    const fonte = `${tamanho}px ${FAMILIA}`;
    this.ctx.font = fonte;
    this.cw = Math.ceil(this.ctx.measureText('M').width);
    this.ch = Math.ceil(tamanho * 1.18);
    const a = this.criarTela(
      Math.ceil(CARACTERES.length * this.cw * this.dpr),
      Math.ceil(PALETAS.length * NIVEIS * this.ch * this.dpr),
    );
    const ac = a.getContext('2d') as Contexto;
    ac.scale(this.dpr, this.dpr);
    ac.textBaseline = 'middle';
    PALETAS.forEach((cores, pi) => {
      ac.font = pi === NEGRITO ? `700 ${fonte}` : fonte;
      for (let n = 0; n < NIVEIS; n++) {
        ac.fillStyle = interpolar(cores, n / (NIVEIS - 1));
        const y = (pi * NIVEIS + n) * this.ch + this.ch / 2;
        CARACTERES.forEach((c, ci) => ac.fillText(c, ci * this.cw, y));
      }
    });
    this.atlas = a;
    this.tamanhoAtlas = tamanho;
  }

  /** Ajusta a grade ao tamanho da área (em pixels CSS). Retorna false se a área está vazia. */
  ajustar(largura: number, altura: number, dpr: number): boolean {
    if (!largura || !altura) return false;
    const dprNovo = Math.min(dpr || 1, 2);
    const tamanho = largura < 700 ? 10 : 12;
    this.tela.width = Math.round(largura * dprNovo);
    this.tela.height = Math.round(altura * dprNovo);
    this.lw = largura;
    this.lh = altura;
    // o atlas só é refeito quando o tamanho da letra ou a densidade de pixels mudam
    if (!this.atlas || tamanho !== this.tamanhoAtlas || dprNovo !== this.dpr) {
      this.dpr = dprNovo;
      this.montarAtlas(tamanho);
    }
    const cols = Math.ceil(largura / this.cw);
    const linhas = Math.ceil(altura / this.ch);
    if (cols * linhas !== this.atrasos.length) {
      this.atrasos = new Float32Array(cols * linhas);
      for (let i = 0; i < this.atrasos.length; i++) this.atrasos[i] = Math.random();
    }
    this.cols = cols;
    this.linhas = linhas;
    return true;
  }

  /** Direção da luz a partir da posição do ponteiro (0..1 na tela). */
  apontar(x: number, y: number): void {
    this.alvoLuzX = -0.55 + (x - 0.5) * 0.9;
    this.alvoLuzY = -0.65 + (y - 0.5) * 0.6;
  }

  /** Avança a animação em dt segundos. */
  avancar(dt: number): void {
    this.tempo += dt;
    if (this.formacao < 1) this.formacao = Math.min(1, this.formacao + dt / 2.8);
    // a luz gira devagar e se inclina na direção do ponteiro
    this.luzX += (this.alvoLuzX + Math.sin(this.tempo * 0.25) * 0.25 - this.luzX) * 0.05;
    this.luzY += (this.alvoLuzY + Math.cos(this.tempo * 0.2) * 0.15 - this.luzY) * 0.05;
  }

  desenhar(): void {
    const atlas = this.atlas;
    if (!atlas) return;
    const ctx = this.ctx;
    const { cw, ch, cols, linhas, dpr, tempo, formacao, atrasos } = this;
    const w = this.lw;
    const h = this.lh;
    const reduzido = this.opcoes.movimentoReduzido;
    const centralizada = this.opcoes.centralizada;
    const desktop = w > 900 && !centralizada;
    // Lupa: centro, raio da lente, meia-espessura do aro e direção do cabo
    // centralizada (tela de entrada): painel estreito e alto, lupa proporcionalmente maior
    const R = Math.min(h * 0.29, w * (centralizada ? 0.3 : 0.18));
    const W = R * 0.17;
    // a lupa percorre o texto devagar
    const deriva = reduzido ? 0 : Math.sin(tempo * 0.16) * w * 0.025;
    const cx = (desktop ? w * 0.79 : w * 0.5) + deriva;
    const cy =
      h * (desktop ? 0.4 : centralizada ? 0.4 : 0.36) +
      (reduzido ? 0 : Math.sin(tempo * 0.23) * h * 0.035);
    const dhx = Math.SQRT1_2;
    const dhy = Math.SQRT1_2;
    const ax = cx + dhx * (R + W * 0.4);
    const ay = cy + dhy * (R + W * 0.4);
    const Lc = R * 1.5; // comprimento do cabo
    const rc = R * 0.17; // raio do cabo
    const sombraX = R * 0.18;
    const sombraY = R * 0.24;

    // Luz direcional (vem de cima, à esquerda; acompanha levemente o ponteiro)
    const lzRaw = 0.75;
    const lnorm = Math.hypot(this.luzX, this.luzY, lzRaw);
    const Lx = this.luzX / lnorm;
    const Ly = this.luzY / lnorm;
    const Lz = lzRaw / lnorm;
    const hn = Math.hypot(Lx, Ly, Lz + 1);
    const Hx = Lx / hn;
    const Hy = Ly / hn;
    const Hz = (Lz + 1) / hn;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const nTexto = TEXTO.length;
    // o texto de fundo rola para cima, uma linha a cada 0,9 s
    const rolagem = Math.floor(tempo / 0.9);
    const nCaos = CAOS.length;
    const fadeIni = desktop ? w * 0.5 : 0;
    const fadeFim = desktop ? w * 0.66 : w * 0.2;
    const sw = cw * dpr;
    const sh = ch * dpr;

    for (let row = 0; row < linhas; row++) {
      const py = row * ch + ch / 2;
      for (let col = 0; col < cols; col++) {
        const px = col * cw + cw / 2;
        const idx = row * cols + col;
        let paleta = 0;
        let nivel = 0; // 0..1
        let caractere = ' ';

        const dx = px - cx;
        const dy = py - cy;
        const d = Math.hypot(dx, dy);

        // projeção no eixo do cabo
        const ux = px - ax;
        const uy = py - ay;
        const ao = (ux * dhx + uy * dhy) / Lc; // 0..1 ao longo do cabo
        const lado = -ux * dhy + uy * dhx; // distância perpendicular (com sinal)
        const colar = ao < 0.1;
        const raioCabo = colar ? rc * 1.4 : rc * (1 - 0.08 * ao);
        const v = lado / raioCabo;

        if (Math.abs(d - R) <= W) {
          // ---- aro: seção circular (toro)
          const t = (d - R) / W;
          const nz = Math.sqrt(Math.max(0, 1 - t * t));
          const nx = (dx / d) * t;
          const ny = (dy / d) * t;
          const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
          const esp = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), 30);
          const lum = 0.08 + 0.62 * dif + 0.9 * esp;
          paleta = 2;
          nivel = lum;
          caractere = RAMPA[Math.min(RAMPA.length - 1, 2 + Math.floor(lum * (RAMPA.length - 2)))];
        } else if (ao >= 0 && ao <= 1 && Math.abs(v) <= 1 && d > R + W * 0.5) {
          // ---- cabo: cilindro com sulcos de empunhadura
          const nz = Math.sqrt(Math.max(0, 1 - v * v));
          const nx = -dhy * v;
          const ny = dhx * v;
          const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
          const esp = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), 22);
          const sulco = colar ? 1 : 0.82 + 0.18 * Math.sin(ao * 70);
          const lum = (0.06 + 0.6 * dif) * sulco + 0.75 * esp;
          paleta = 2;
          nivel = lum;
          caractere = RAMPA[Math.min(RAMPA.length - 1, 2 + Math.floor(lum * (RAMPA.length - 2)))];
        } else if (d < R - W) {
          // ---- lente: na mesma grade do fundo, o texto aparece legível
          const q = d / (R - W);
          const pos = ((((row + rolagem) * cols + col) % nTexto) + nTexto) % nTexto;
          caractere = TEXTO[pos];
          // superfície abaulada: reflexo especular e borda mais clara (Fresnel)
          const qx = (dx / (R - W)) * 0.75;
          const qy = (dy / (R - W)) * 0.75;
          const nz = Math.sqrt(Math.max(0, 1 - qx * qx - qy * qy));
          const esp = Math.pow(Math.max(0, qx * Hx + qy * Hy + nz * Hz), 70);
          const borda = suave(0.72, 1, q) * 0.35;
          const lum = 0.32 + 0.25 * (1 - q) + borda;
          paleta = EM_NEGRITO[pos] ? NEGRITO : 1;
          nivel = EM_NEGRITO[pos] ? 0.55 + lum * 0.5 : lum;
          if (esp > 0.35) {
            caractere = RAMPA[Math.min(RAMPA.length - 1, 6 + Math.floor(esp * 8))];
            nivel = 1;
          } else if (caractere === ' ') {
            caractere = q > 0.9 ? ':' : ' ';
            nivel = 0.5;
          }
        } else {
          // ---- fundo: caracteres sem ordem, iluminados, com sombra projetada da lupa
          const sx = px - sombraX;
          const sy = py - sombraY;
          const sd = Math.hypot(sx - cx, sy - cy);
          const su = ((sx - ax) * dhx + (sy - ay) * dhy) / Lc;
          const sv = Math.abs(-(sx - ax) * dhy + (sy - ay) * dhx) / rc;
          let sombra = 0;
          // aro e cabo: sombra densa; vidro: sombra leve
          sombra = Math.max(sombra, 1 - suave(W * 0.6, W * 2.4, Math.abs(sd - R)));
          if (sd < R) sombra = Math.max(sombra, 0.35);
          if (su >= 0 && su <= 1) sombra = Math.max(sombra, 1 - suave(0.9, 2.2, sv));
          // luz concentrada pela lente no meio da sombra do vidro
          const foco = Math.exp(-((sd / (R * 0.28)) ** 2)) * 0.9;
          const luzAmbiente =
            0.3 +
            0.55 *
              Math.exp(
                -(((px - cx + R * 0.6) / (w * 0.55)) ** 2 + ((py - cy + R) / (h * 1.1)) ** 2),
              );
          const mascara = suave(fadeIni, fadeFim, px) * (0.6 + 0.4 * suave(h, h * 0.15, py));
          const lum = (luzAmbiente * 0.85 * (1 - 0.75 * sombra) + foco) * mascara;
          nivel = lum;
          paleta = 0;
          if (lum > 0.36) {
            // cada célula troca de caractere em momentos diferentes
            const troca = Math.floor(tempo * 0.45 + ruido(col, row, 0) * 9);
            caractere = CAOS[Math.floor(ruido(col, row, troca) * nCaos)];
          } else if (lum > 0.2) {
            caractere = (row + col) % 3 === 0 ? ':' : '.';
          } else if (lum > 0.1) {
            caractere = (row * 7 + col) % 5 === 0 ? '.' : ' ';
          }
          if (foco > 0.25 && mascara > 0.5) {
            paleta = 2;
            nivel = 0.55 + foco * 0.5;
          }
        }

        // formação: caracteres embaralhados que se fixam com atraso próprio
        if (formacao < 1) {
          const inicio = atrasos[idx] * 0.65;
          const p = (formacao - inicio) / 0.35;
          if (p < 1) {
            if (caractere === ' ' || p < 0) {
              if (p < 0 && atrasos[(idx * 7) % atrasos.length] < 0.12 * (1 - formacao)) {
                caractere = RAMPA[1 + Math.floor(Math.random() * (RAMPA.length - 1))];
                paleta = 2;
                nivel = 0.25;
              } else continue;
            } else {
              caractere = RAMPA[1 + Math.floor(Math.random() * (RAMPA.length - 1))];
              nivel *= 0.4 + 0.6 * p;
            }
          }
        }

        if (caractere === ' ') continue;
        const ci = INDICE.get(caractere);
        if (ci === undefined) continue;
        const n = Math.min(NIVEIS - 1, Math.max(0, Math.round(nivel * (NIVEIS - 1))));
        ctx.drawImage(
          atlas,
          ci * sw,
          (paleta * NIVEIS + n) * sh,
          sw,
          sh,
          col * cw,
          row * ch,
          cw,
          ch,
        );
      }
    }
  }
}
