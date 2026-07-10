const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlIntFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const numFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const brl = (v: number) => brlFmt.format(v)
export const brlInt = (v: number) => brlIntFmt.format(v)
export const num = (v: number) => numFmt.format(v)

/** 0.265 → "26,5%" */
export const pct = (fracao: number, casas = 1) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: 0 }).format(fracao * 100)}%`

/** variação com sinal: 0.034 → "+3,4%" */
export const pctDelta = (fracao: number, casas = 1) =>
  `${fracao > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(fracao * 100)}%`
