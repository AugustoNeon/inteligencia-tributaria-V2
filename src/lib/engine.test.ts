import { describe, expect, it } from 'vitest'
import { CATEGORIAS } from '../data/categorias'
import type { CategoriaCalc } from '../data/categorias'
import { ALIQUOTA_REFERENCIA } from '../data/tributos'
import { aliquotasNoAno, calcularHoje, calcularNoAno, comparar, trajetoriaPreco } from './engine'

const cat = (id: string): CategoriaCalc => {
  const c = CATEGORIAS.find((x) => x.id === id)
  if (!c) throw new Error(`categoria de teste inexistente: ${id}`)
  return c
}

describe('calcularHoje — tributos por dentro', () => {
  it('produto padrão a R$ 1.000: ICMS 18% + PIS/Cofins 9,25% = 27,25% do preço', () => {
    const c = calcularHoje(1000, cat('produto-padrao').atual)
    expect(c.totalImpostos).toBeCloseTo(272.5, 2)
    expect(c.carga).toBeCloseTo(0.2725, 4)
    expect(c.precoSemImposto).toBeCloseTo(727.5, 2)
    expect(c.itens.find((i) => i.id === 'icms')?.valor).toBeCloseTo(180, 2)
    expect(c.itens.find((i) => i.id === 'piscofins')?.valor).toBeCloseTo(92.5, 2)
  })

  it('serviço padrão: ISS 5% + PIS/Cofins cumulativo 3,65%', () => {
    const c = calcularHoje(1000, cat('servico-padrao').atual)
    expect(c.carga).toBeCloseTo(0.0865, 4)
    expect(c.itens.map((i) => i.id).sort()).toEqual(['iss', 'piscofins'])
  })

  it('itens com valor zero não aparecem na composição', () => {
    const c = calcularHoje(1000, cat('produto-padrao').atual)
    expect(c.itens.some((i) => i.id === 'ipi')).toBe(false)
    expect(c.itens.some((i) => i.id === 'iss')).toBe(false)
  })
})

describe('calcularNoAno — sistema pleno (2033)', () => {
  it('produto padrão: repasse integral leva R$ 1.000 a ~R$ 920,29', () => {
    const categoria = cat('produto-padrao')
    const novo = calcularNoAno(1000, categoria, categoria.atual, 2033)
    expect(novo.precoFinal).toBeCloseTo(920.29, 2)
    expect(novo.carga).toBeCloseTo(0.265 / 1.265, 3)
    // só o IVA dual — nada de tributos antigos
    expect(novo.itens.map((i) => i.id).sort()).toEqual(['cbs', 'ibs'])
    expect(novo.itens.find((i) => i.id === 'cbs')?.valor).toBeCloseTo(727.5 * 0.088, 1)
    expect(novo.itens.find((i) => i.id === 'ibs')?.valor).toBeCloseTo(727.5 * 0.177, 1)
  })

  it('serviço padrão encarece: R$ 1.000 → ~R$ 1.155,58', () => {
    const categoria = cat('servico-padrao')
    const novo = calcularNoAno(1000, categoria, categoria.atual, 2033)
    expect(novo.precoFinal).toBeCloseTo(1155.58, 2)
  })

  it('cesta básica: alíquota zero — preço final = preço sem tributos', () => {
    const categoria = cat('cesta-basica')
    const hoje = calcularHoje(1000, categoria.atual)
    const novo = calcularNoAno(1000, categoria, categoria.atual, 2033)
    expect(novo.carga).toBe(0)
    expect(novo.precoFinal).toBeCloseTo(hoje.precoSemImposto, 2)
    expect(novo.precoFinal).toBeLessThan(hoje.precoFinal)
  })

  it('redução de 60% (saúde): alíquota efetiva 10,6% por fora', () => {
    const categoria = cat('saude')
    const novo = calcularNoAno(1000, categoria, categoria.atual, 2033)
    const base = 1000 * (1 - 0.03 - 0.0365)
    expect(novo.precoFinal).toBeCloseTo(base * (1 + 0.265 * 0.4), 2)
  })
})

describe('calcularNoAno — anos de convivência', () => {
  it('2026 é ano-teste: carga idêntica à atual', () => {
    const categoria = cat('produto-padrao')
    const c = calcularNoAno(1000, categoria, categoria.atual, 2026)
    expect(c.anoTeste).toBe(true)
    expect(c.precoFinal).toBeCloseTo(1000, 2)
    expect(c.carga).toBeCloseTo(0.2725, 4)
  })

  it('2029: fórmula por dentro/por fora — P = B(1+tFora)/(1−tDentro)', () => {
    const categoria = cat('produto-padrao')
    const c = calcularNoAno(1000, categoria, categoria.atual, 2029)
    const base = 727.5
    const tFora = 0.088 + 0.177 * 0.1
    const tDentro = 0.9 * 0.18
    expect(c.precoFinal).toBeCloseTo((base * (1 + tFora)) / (1 - tDentro), 2)
    // convivência: IVA novo e ICMS antigo na mesma nota
    expect(c.itens.some((i) => i.id === 'cbs')).toBe(true)
    expect(c.itens.some((i) => i.id === 'icms')).toBe(true)
  })

  it('produto padrão fica mais barato ano a ano de 2027 a 2033', () => {
    const categoria = cat('produto-padrao')
    const t = trajetoriaPreco(1000, categoria, categoria.atual).filter((p) => p.ano >= 2027)
    for (let i = 1; i < t.length; i++) {
      expect(t[i].cenario.precoFinal).toBeLessThanOrEqual(t[i - 1].cenario.precoFinal + 0.01)
    }
  })
})

describe('aliquotasNoAno — cronograma da transição', () => {
  it('2027–2028: CBS com desconto de 0,1 p.p. e IBS-teste de 0,1%', () => {
    const a = aliquotasNoAno(2027, 0)
    expect(a.cbs).toBeCloseTo(0.087, 4)
    expect(a.ibs).toBeCloseTo(0.001, 4)
    expect(a.pisCofinsAtivos).toBe(false)
  })

  it('2029: CBS cheia; IBS assume 10% do espaço do ICMS/ISS', () => {
    const a = aliquotasNoAno(2029, 0)
    expect(a.cbs).toBeCloseTo(ALIQUOTA_REFERENCIA.cbs, 4)
    expect(a.ibs).toBeCloseTo(ALIQUOTA_REFERENCIA.ibs * 0.1, 4)
    expect(a.fatorIcmsIss).toBeCloseTo(0.9, 4)
  })

  it('2033: sistema pleno — fator zero, IBS integral', () => {
    const a = aliquotasNoAno(2033, 0)
    expect(a.fatorIcmsIss).toBe(0)
    expect(a.ibs).toBeCloseTo(ALIQUOTA_REFERENCIA.ibs, 4)
  })

  it('redução da categoria multiplica as duas pontas do IVA', () => {
    const a = aliquotasNoAno(2033, 0.6)
    expect(a.cbs + a.ibs).toBeCloseTo(0.265 * 0.4, 4)
  })
})

describe('comparar', () => {
  it('delta de preço e alíquota efetiva do profissional liberal (redução 30%)', () => {
    const categoria = cat('profissional-liberal')
    const r = comparar(1000, categoria, categoria.atual, 2033)
    expect(r.aliquotaIvaEfetiva).toBeCloseTo(0.265 * 0.7, 4)
    expect(r.deltaPreco).toBeCloseTo(r.novo.precoFinal - r.hoje.precoFinal, 6)
    expect(r.deltaCarga).toBeCloseTo(r.novo.carga - r.hoje.carga, 6)
  })
})
