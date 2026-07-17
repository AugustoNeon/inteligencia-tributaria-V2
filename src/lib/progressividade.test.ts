import { describe, expect, it } from 'vitest'
import { FAIXAS_RENDA } from '../data/progressividade'
import { curvaProgressividade } from './progressividade'

describe('curvaProgressividade', () => {
  it('os pesos de cada faixa somam exatamente 1', () => {
    for (const f of FAIXAS_RENDA) {
      const soma = Object.values(f.pesos).reduce((s, v) => s + v, 0)
      expect(soma, `faixa ${f.id}`).toBeCloseTo(1, 9)
    }
  })

  it('as faixas vêm em ordem crescente de renda', () => {
    const rendas = FAIXAS_RENDA.map((f) => f.rendaFamiliar)
    expect([...rendas].sort((a, b) => a - b)).toEqual(rendas)
  })

  it('imposto de consumo é regressivo hoje: pesa mais na renda menor', () => {
    const curva = curvaProgressividade('SP')
    expect(curva[0].cargaHoje).toBeGreaterThan(curva[curva.length - 1].cargaHoje)
  })

  it('cashback só chega às faixas elegíveis (renda per capita ≤ meio salário)', () => {
    const curva = curvaProgressividade('SP')
    // família de 4 com R$ 1,6 mil e R$ 3,2 mil: per capita 400 e 800 ≤ 810,50
    expect(curva[0].elegivel).toBe(true)
    expect(curva[0].cashbackMensal).toBeGreaterThan(0)
    expect(curva[1].elegivel).toBe(true)
    // das demais em diante, nada
    for (const ponto of curva.slice(2)) {
      expect(ponto.elegivel, ponto.faixa.id).toBe(false)
      expect(ponto.cashbackMensal).toBe(0)
      expect(ponto.cargaComCashback).toBeCloseTo(ponto.cargaNova, 9)
    }
  })

  it('o cashback reduz a carga efetiva das faixas elegíveis', () => {
    const curva = curvaProgressividade('SP')
    expect(curva[0].cargaComCashback).toBeLessThan(curva[0].cargaNova)
  })

  it('cargas são frações plausíveis da renda (entre 0 e 30%)', () => {
    for (const ponto of curvaProgressividade('SP')) {
      for (const carga of [ponto.cargaHoje, ponto.cargaNova]) {
        expect(carga).toBeGreaterThan(0)
        expect(carga).toBeLessThan(0.3)
      }
    }
  })
})
