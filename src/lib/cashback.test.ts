import { describe, expect, it } from 'vitest'
import { calcularCashback, type EntradaCashback } from './cashback'

/** cenário validado manualmente: família de 4, renda R$ 2.800, gastos típicos */
const FAMILIA_BASE: EntradaCashback = {
  pessoas: 4,
  rendaFamiliar: 2800,
  inscritoCadUnico: true,
  salarioMinimo: 1621,
  gastos: { energia: 180, agua: 90, 'gas-encanado': 0, botijao: 110, telecom: 120 },
  demaisCompras: 600,
}

const shareCBS = 0.088 / 1.265
const shareIBS = 0.177 / 1.265

describe('elegibilidade', () => {
  it('renda por pessoa até meio salário mínimo + CadÚnico = elegível', () => {
    const r = calcularCashback(FAMILIA_BASE)
    expect(r.rendaPerCapita).toBeCloseTo(700, 2)
    expect(r.limite).toBeCloseTo(810.5, 2)
    expect(r.elegivel).toBe(true)
  })

  it('renda acima do limite: inelegível e devolução mensal zerada', () => {
    const r = calcularCashback({ ...FAMILIA_BASE, rendaFamiliar: 10000 })
    expect(r.elegivel).toBe(false)
    expect(r.totalMensal).toBe(0)
    // o potencial por linha continua calculado (a UI mostra o "se fosse elegível")
    expect(r.linhas.reduce((s, l) => s + l.devolucao, 0)).toBeGreaterThan(0)
  })

  it('sem CadÚnico não há devolução, mesmo com renda baixa', () => {
    const r = calcularCashback({ ...FAMILIA_BASE, inscritoCadUnico: false })
    expect(r.elegivel).toBe(false)
    expect(r.totalMensal).toBe(0)
  })
})

describe('regras de devolução (mínimos da LC 214/2025)', () => {
  it('conta essencial devolve 100% da CBS + 20% do IBS embutidos', () => {
    const r = calcularCashback({
      ...FAMILIA_BASE,
      gastos: { energia: 100, agua: 0, 'gas-encanado': 0, botijao: 0, telecom: 0 },
      demaisCompras: 0,
    })
    const energia = r.linhas.find((l) => l.id === 'energia')!
    expect(energia.cbsEmbutida).toBeCloseTo(100 * shareCBS, 4)
    expect(energia.ibsEmbutido).toBeCloseTo(100 * shareIBS, 4)
    expect(energia.devolucao).toBeCloseTo(100 * shareCBS + 100 * shareIBS * 0.2, 4)
  })

  it('demais compras devolvem 20% de CBS e IBS', () => {
    const r = calcularCashback({
      ...FAMILIA_BASE,
      gastos: { energia: 0, agua: 0, 'gas-encanado': 0, botijao: 0, telecom: 0 },
      demaisCompras: 600,
    })
    const demais = r.linhas.find((l) => l.id === 'demais')!
    expect(demais.devolucao).toBeCloseTo(600 * (shareCBS + shareIBS) * 0.2, 4)
  })

  it('cenário completo: ~R$ 73,91/mês, projeção anual ×12', () => {
    const r = calcularCashback(FAMILIA_BASE)
    expect(r.totalMensal).toBeCloseTo(73.91, 1)
    expect(r.totalAnual).toBeCloseTo(r.totalMensal * 12, 6)
    expect(r.pesoNaRenda).toBeCloseTo(r.totalMensal / 2800, 6)
  })

  it('imposto embutido total = 20,95% de todo o gasto tributado', () => {
    const r = calcularCashback(FAMILIA_BASE)
    const gastoTotal = 180 + 90 + 0 + 110 + 120 + 600
    expect(r.impostoEmbutidoTotal).toBeCloseTo(gastoTotal * (0.265 / 1.265), 2)
  })
})
