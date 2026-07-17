import { describe, expect, it } from 'vitest'
import { LIMITES_REGIME, compararCredito, opcoesDoVendedor } from './regime'

const disponiveis = (receita: number, rural = false) =>
  opcoesDoVendedor(receita, rural)
    .filter((o) => o.disponivel)
    .map((o) => o.id)

describe('opcoesDoVendedor', () => {
  it('até R$ 40,5 mil: todas as portas abertas, inclusive ficar fora do IVA', () => {
    expect(disponiveis(40_500)).toEqual(['nano', 'mei', 'simples-dentro', 'simples-fora', 'regular'])
  })

  it('R$ 1 acima do teto do nanoempreendedor fecha a porta de ficar fora', () => {
    expect(disponiveis(40_501)).not.toContain('nano')
    expect(disponiveis(40_501)).toContain('mei')
  })

  it('acima de R$ 81 mil deixa de caber no MEI, mas segue no Simples', () => {
    expect(disponiveis(81_001)).toEqual(['simples-dentro', 'simples-fora', 'regular'])
  })

  it('acima de R$ 4,8 mi só resta o regime regular', () => {
    expect(disponiveis(4_800_001)).toEqual(['regular'])
  })

  it('produtor rural até R$ 3,6 mi pode optar por não ser contribuinte', () => {
    expect(disponiveis(3_600_000, true)).toContain('rural-fora')
    expect(disponiveis(3_600_001, true)).not.toContain('rural-fora')
    // sem a atividade rural, a opção não existe em nenhuma faixa
    expect(disponiveis(100_000, false)).not.toContain('rural-fora')
  })

  it('receita negativa é tratada como zero', () => {
    expect(disponiveis(-5)).toEqual(disponiveis(0))
  })

  it('limites exportados batem com a LC 214/2025', () => {
    expect(LIMITES_REGIME.nanoempreendedor * 2).toBe(LIMITES_REGIME.mei)
    expect(LIMITES_REGIME.simples).toBe(4_800_000)
    expect(LIMITES_REGIME.produtorRural).toBe(3_600_000)
  })
})

describe('compararCredito', () => {
  it('venda de R$ 1.000 na alíquota padrão: crédito integral de R$ 265 por fora', () => {
    const c = compararCredito(1000, 0.265, 0.03)
    expect(c.porFora).toBeCloseTo(265, 6)
    expect(c.porDentro).toBeCloseTo(30, 6)
    expect(c.diferenca).toBeCloseTo(235, 6)
  })

  it('categoria com alíquota zero não transfere crédito em nenhum regime', () => {
    const c = compararCredito(1000, 0, 0.03)
    expect(c.porFora).toBe(0)
    expect(c.porDentro).toBe(0)
    expect(c.diferenca).toBe(0)
  })

  it('crédito por dentro nunca supera o crédito integral', () => {
    const c = compararCredito(1000, 0.106, 0.2)
    expect(c.porDentro).toBeLessThanOrEqual(c.porFora)
  })
})
