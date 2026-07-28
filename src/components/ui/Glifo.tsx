/**
 * Glifos do índice da Home: cada um é a miniatura do gráfico que aquela
 * página contém, não um ícone genérico. O visitante aprende pelo desenho que
 * tipo de resposta vai receber — uma comparação, um empilhamento, um saldo.
 *
 * Seguem a regra semântica do projeto (DESIGN.md): cobre para o sistema
 * antigo, a cor herdada (petróleo no hover) para o novo. Por isso o cobre vem
 * de `var(--copper-deep)` e o resto de `currentColor`: o glifo acompanha o
 * estado do link sem precisar de uma regra por estado.
 *
 * SVG inline de propósito. Com <symbol>/<use> o conteúdo clonado vive em
 * shadow DOM, onde seletores do documento não chegam — as formas caem no
 * `fill: black` padrão e somem no tema escuro.
 */

import type { ReactNode } from 'react'

export type TipoGlifo =
  | 'guia'
  | 'tempo'
  | 'calculadora'
  | 'cesta'
  | 'cashback'
  | 'raio-x'
  | 'setores'
  | 'glossario'
  | 'vende'

const traco = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const cobre = { fill: 'var(--copper-deep)' }
const cobreTraco = { fill: 'none', stroke: 'var(--copper-deep)' }

const DESENHOS: Record<TipoGlifo, ReactNode> = {
  // cinco tributos desaguando em três
  guia: (
    <>
      <path {...traco} d="M4 5 C 13 5, 13 9, 22 9" />
      <path {...traco} d="M4 13 C 13 13, 13 9, 22 9" />
      <path {...traco} d="M4 21 C 13 21, 13 17, 22 17" />
      <circle cx="4" cy="5" r="2.1" style={cobre} />
      <circle cx="4" cy="13" r="2.1" style={cobre} />
      <circle cx="4" cy="21" r="2.1" style={cobre} />
      <circle cx="22" cy="9" r="2.4" fill="currentColor" />
      <circle cx="22" cy="17" r="2.4" fill="currentColor" />
    </>
  ),
  // o antigo descendo enquanto o novo sobe, ano a ano
  tempo: (
    <>
      <path {...traco} d="M3 22 H23" opacity={0.45} />
      <path {...traco} {...cobreTraco} strokeWidth={1.8} d="M4 7 L10 10.5 L16 14.5 L22 18.5" />
      <path {...traco} strokeWidth={1.8} d="M4 18.5 L10 15 L16 10.5 L22 6" />
      <circle cx="22" cy="6" r="2.2" fill="currentColor" />
    </>
  ),
  // duas barras: hoje contra o ano escolhido
  calculadora: (
    <>
      <path {...traco} d="M3 22 H23" opacity={0.45} />
      <rect x="6" y="5" width="6.5" height="15" rx="1.6" style={cobre} />
      <rect x="15" y="11" width="6.5" height="9" rx="1.6" fill="currentColor" />
    </>
  ),
  // o orçamento do mês empilhado por categoria
  cesta: (
    <>
      <rect x="7" y="4" width="12" height="4.8" rx="1.5" style={cobre} />
      <rect x="7" y="10.6" width="12" height="4.8" rx="1.5" fill="currentColor" opacity={0.5} />
      <rect x="7" y="17.2" width="12" height="4.8" rx="1.5" fill="currentColor" />
    </>
  ),
  // parte do imposto voltando
  cashback: (
    <>
      <path {...traco} strokeWidth={1.8} d="M21 13 A 8.5 8.5 0 1 1 18 6.4" />
      <path {...traco} strokeWidth={1.8} d="M12.6 6 H18.6 V 11.8" />
      <circle cx="13" cy="13.5" r="2.8" style={cobre} />
    </>
  ),
  // o que sai menos o que volta, dos dois lados de um eixo
  'raio-x': (
    <>
      <path {...traco} d="M3 13 H23" opacity={0.45} />
      <rect x="6" y="4" width="5.5" height="9" rx="1.5" style={cobre} />
      <rect x="14.5" y="13" width="5.5" height="7" rx="1.5" fill="currentColor" />
    </>
  ),
  // slope: quem sobe e quem desce no sistema pleno
  setores: (
    <>
      <path {...traco} strokeWidth={1.4} d="M5 3 V23" opacity={0.4} />
      <path {...traco} strokeWidth={1.4} d="M21 3 V23" opacity={0.4} />
      <path {...traco} strokeWidth={1.7} d="M5 8 L21 5" />
      <path {...traco} {...cobreTraco} strokeWidth={1.7} d="M5 13 L21 20" />
      <path {...traco} strokeWidth={1.7} d="M5 19 L21 14" />
    </>
  ),
  // o índice de termos e documentos
  glossario: (
    <>
      <path {...traco} strokeWidth={1.7} d="M4 6 H19" />
      <path {...traco} strokeWidth={1.7} d="M4 11.3 H14" />
      <path {...traco} strokeWidth={1.7} d="M4 16.6 H17" />
      <path {...traco} strokeWidth={1.7} d="M4 21.9 H11" />
      <circle cx="21.5" cy="11.3" r="1.7" style={cobre} />
    </>
  ),
  // a régua de receita anual com o marcador do negócio
  vende: (
    <>
      <path {...traco} strokeWidth={1.7} d="M3 17 H23" />
      <path {...traco} strokeWidth={1.5} d="M7 17 V20.5" opacity={0.55} />
      <path {...traco} strokeWidth={1.5} d="M13 17 V20.5" opacity={0.55} />
      <path {...traco} strokeWidth={1.5} d="M19 17 V20.5" opacity={0.55} />
      <path d="M10 13 L13.4 6.5 L16.8 13 Z" style={cobre} />
    </>
  ),
}

export function Glifo({ tipo }: { tipo: TipoGlifo }) {
  return (
    <svg className="glifo" viewBox="0 0 26 26" aria-hidden width="26" height="26">
      {DESENHOS[tipo]}
    </svg>
  )
}
