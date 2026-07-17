import { describe, expect, it } from 'vitest'
import { PESOS_CESTA, PESOS_CONTAS, simularPainel } from './painel'

const FAMILIA_ELEGIVEL = {
  pessoas: 4,
  rendaFamiliar: 2_800,
  inscritoCadUnico: true,
  consumo: 2_600,
  uf: 'SP',
  salarioMinimo: 1_621,
}

describe('simularPainel', () => {
  it('os pesos do consumo somam exatamente 1', () => {
    const soma = [...Object.values(PESOS_CESTA), ...Object.values(PESOS_CONTAS)].reduce((s, v) => s + v, 0)
    expect(soma).toBeCloseTo(1, 9)
  })

  it('o consumo se divide entre cesta e contas sem sobra', () => {
    const r = simularPainel(FAMILIA_ELEGIVEL)
    expect(r.consumoCesta + r.consumoContas).toBeCloseTo(FAMILIA_ELEGIVEL.consumo, 6)
    expect(r.cesta.hoje.precoFinal).toBeCloseTo(r.consumoCesta, 6)
  })

  it('família elegível: efeito líquido = variação da cesta − cashback', () => {
    const r = simularPainel(FAMILIA_ELEGIVEL)
    expect(r.cashback.elegivel).toBe(true)
    expect(r.cashback.totalMensal).toBeGreaterThan(0)
    expect(r.efeitoLiquidoMensal).toBeCloseTo(r.cesta.deltaMensal - r.cashback.totalMensal, 6)
    expect(r.efeitoLiquidoAnual).toBeCloseTo(r.efeitoLiquidoMensal * 12, 6)
  })

  it('família fora do CadÚnico: cashback zero, líquido = variação da cesta', () => {
    const r = simularPainel({ ...FAMILIA_ELEGIVEL, inscritoCadUnico: false })
    expect(r.cashback.totalMensal).toBe(0)
    expect(r.efeitoLiquidoMensal).toBeCloseTo(r.cesta.deltaMensal, 6)
  })

  it('renda acima do teto per capita também zera o cashback', () => {
    const r = simularPainel({ ...FAMILIA_ELEGIVEL, rendaFamiliar: 12_000 })
    expect(r.cashback.elegivel).toBe(false)
    expect(r.cashback.totalMensal).toBe(0)
  })

  it('o retrato é sempre do sistema pleno (2033)', () => {
    const r = simularPainel(FAMILIA_ELEGIVEL)
    expect(r.cesta.novo.ano).toBe(2033)
    expect(r.cesta.novo.itens.map((i) => i.id)).not.toContain('icms')
  })
})
