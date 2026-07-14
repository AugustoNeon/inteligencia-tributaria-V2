import { describe, expect, it } from 'vitest'
import { CATEGORIAS } from '../data/categorias'
import { icmsDaUf } from '../data/icmsUf'
import { comparar } from './engine'
import { cestaInicial, simularCesta } from './cesta-mensal'

const CESTA_SIMPLES = [
  { categoriaId: 'cesta-basica', rotulo: 'Mercado', valor: 500 },
  { categoriaId: 'servico-padrao', rotulo: 'Serviços', valor: 300 },
]

describe('simularCesta', () => {
  it('o total agregado é a soma dos itens simulados um a um', () => {
    const r = simularCesta(CESTA_SIMPLES, 'SP', 2033)
    let esperadoHoje = 0
    let esperadoNovo = 0
    for (const item of CESTA_SIMPLES) {
      const categoria = CATEGORIAS.find((c) => c.id === item.categoriaId)!
      const perfil = categoria.icmsModal ? { ...categoria.atual, icms: icmsDaUf('SP').aliquota } : categoria.atual
      const c = comparar(item.valor, categoria, perfil, 2033)
      esperadoHoje += c.hoje.precoFinal
      esperadoNovo += c.novo.precoFinal
    }
    expect(r.hoje.precoFinal).toBeCloseTo(esperadoHoje, 6)
    expect(r.novo.precoFinal).toBeCloseTo(esperadoNovo, 6)
  })

  it('agrega os tributos por sigla: um segmento por tributo, não por item', () => {
    const r = simularCesta(cestaInicial(), 'SP', 2033)
    const ids = r.novo.itens.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('cbs')
    expect(ids).toContain('ibs')
    expect(ids).not.toContain('icms') // 2033: ICMS extinto
  })

  it('a soma dos segmentos agregados bate com o total de impostos', () => {
    const r = simularCesta(cestaInicial(), 'RJ', 2030)
    const soma = r.novo.itens.reduce((s, i) => s + i.valor, 0)
    expect(r.novo.totalImpostos).toBeCloseTo(soma, 6)
    expect(r.novo.precoSemImposto).toBeCloseTo(r.novo.precoFinal - soma, 6)
  })

  it('em 2026 (ano-teste) a cesta custa o mesmo que hoje', () => {
    const r = simularCesta(cestaInicial(), 'SP', 2026)
    expect(r.novo.precoFinal).toBeCloseTo(r.hoje.precoFinal, 2)
    expect(r.deltaMensal).toBeCloseTo(0, 2)
    expect(r.novo.anoTeste).toBe(true)
  })

  it('cesta básica (alíquota zero) não gera CBS/IBS no sistema pleno', () => {
    const r = simularCesta([{ categoriaId: 'cesta-basica', rotulo: 'Mercado', valor: 500 }], 'SP', 2033)
    expect(r.novo.itens.find((i) => i.id === 'cbs')).toBeUndefined()
    expect(r.novo.itens.find((i) => i.id === 'ibs')).toBeUndefined()
    expect(r.novo.precoFinal).toBeLessThan(r.hoje.precoFinal)
  })

  it('itens zerados ou inválidos ficam fora da conta', () => {
    const r = simularCesta(
      [
        { categoriaId: 'servico-padrao', rotulo: 'Serviços', valor: 300 },
        { categoriaId: 'educacao', rotulo: 'Educação', valor: 0 },
        { categoriaId: 'medicamentos', rotulo: 'Remédios', valor: NaN },
      ],
      'SP',
      2033,
    )
    expect(r.linhas).toHaveLength(1)
    expect(r.linhas[0].categoriaId).toBe('servico-padrao')
  })

  it('delta anual é 12× o mensal', () => {
    const r = simularCesta(cestaInicial(), 'SP', 2033)
    expect(r.deltaAnual).toBeCloseTo(r.deltaMensal * 12, 6)
  })

  it('o ICMS da cesta segue o estado escolhido', () => {
    const soSP = simularCesta([{ categoriaId: 'produto-padrao', rotulo: 'Produtos', valor: 400 }], 'SP', 2030)
    const soMA = simularCesta([{ categoriaId: 'produto-padrao', rotulo: 'Produtos', valor: 400 }], 'MA', 2030)
    const icmsSP = soSP.novo.itens.find((i) => i.id === 'icms')!.valor
    const icmsMA = soMA.novo.itens.find((i) => i.id === 'icms')!.valor
    expect(icmsMA).toBeGreaterThan(icmsSP) // MA 23% > SP 18%
  })
})
