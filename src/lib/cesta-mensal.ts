/**
 * Motor da cesta mensal: agrega vários itens da calculadora comparativa
 * num único orçamento — mesmo modelo do engine.ts, aplicado item a item
 * e somado por tributo.
 */

import { CATEGORIAS } from '../data/categorias'
import { CESTA_PADRAO } from '../data/cesta'
import { icmsDaUf } from '../data/icmsUf'
import { calcularHoje, calcularNoAno, type Cenario, type ItemImposto } from './engine'

export interface ItemCestaValor {
  categoriaId: string
  rotulo: string
  valor: number
}

export interface LinhaCesta {
  categoriaId: string
  rotulo: string
  hoje: number
  novo: number
  delta: number
}

export interface ResultadoCesta {
  hoje: Cenario
  novo: Cenario
  linhas: LinhaCesta[]
  deltaMensal: number
  deltaAnual: number
}

const ORDEM_TRIBUTOS = ['icms', 'iss', 'piscofins', 'ipi', 'cbs', 'ibs']

/** Soma cenários item a item, agregando os tributos pela mesma sigla. */
function somar(rotulo: string, ano: number, cenarios: Cenario[]): Cenario {
  const porTributo = new Map<string, ItemImposto>()
  let precoFinal = 0
  for (const c of cenarios) {
    precoFinal += c.precoFinal
    for (const item of c.itens) {
      const acum = porTributo.get(item.id)
      if (acum) acum.valor += item.valor
      else porTributo.set(item.id, { ...item })
    }
  }
  const itens = ORDEM_TRIBUTOS.flatMap((id) => porTributo.get(id) ?? [])
  const total = itens.reduce((s, i) => s + i.valor, 0)
  return {
    rotulo,
    ano,
    precoFinal,
    precoSemImposto: precoFinal - total,
    itens,
    totalImpostos: total,
    carga: precoFinal > 0 ? total / precoFinal : 0,
    anoTeste: cenarios.some((c) => c.anoTeste),
  }
}

/** Perfil tributário do item: o da categoria, com ICMS modal do estado quando se aplica. */
function perfilDoItem(categoriaId: string, uf: string) {
  const categoria = CATEGORIAS.find((c) => c.id === categoriaId)!
  const perfil = categoria.icmsModal ? { ...categoria.atual, icms: icmsDaUf(uf).aliquota } : categoria.atual
  return { categoria, perfil }
}

export function simularCesta(itens: ItemCestaValor[], uf: string, ano: number): ResultadoCesta {
  const ativos = itens.filter((i) => Number.isFinite(i.valor) && i.valor > 0)

  const cenariosHoje: Cenario[] = []
  const cenariosNovo: Cenario[] = []
  const linhas: LinhaCesta[] = []

  for (const item of ativos) {
    const { categoria, perfil } = perfilDoItem(item.categoriaId, uf)
    const hoje = calcularHoje(item.valor, perfil)
    const novo = calcularNoAno(item.valor, categoria, perfil, ano)
    cenariosHoje.push(hoje)
    cenariosNovo.push(novo)
    linhas.push({
      categoriaId: item.categoriaId,
      rotulo: item.rotulo,
      hoje: hoje.precoFinal,
      novo: novo.precoFinal,
      delta: novo.precoFinal - hoje.precoFinal,
    })
  }

  const hoje = somar('Hoje', 2025, cenariosHoje)
  const novo = somar(ano === 2033 ? 'Sistema pleno (2033)' : `Em ${ano}`, ano, cenariosNovo)
  const deltaMensal = novo.precoFinal - hoje.precoFinal

  return { hoje, novo, linhas, deltaMensal, deltaAnual: deltaMensal * 12 }
}

/** Cesta padrão como estado inicial da página. */
export const cestaInicial = (): ItemCestaValor[] =>
  CESTA_PADRAO.map((i) => ({ categoriaId: i.categoriaId, rotulo: i.rotulo, valor: i.valorPadrao }))

/** CSV pt-BR da simulação (separador ; e vírgula decimal) — abre direto no Excel. */
export function csvDaCesta(r: ResultadoCesta, ano: number): string {
  const num = (v: number) => v.toFixed(2).replace('.', ',')
  const linhas = [
    ['Categoria', 'Hoje (R$)', `Em ${ano} (R$)`, 'Diferença/mês (R$)'],
    ...r.linhas.map((l) => [l.rotulo, num(l.hoje), num(l.novo), num(l.delta)]),
    ['Total', num(r.hoje.precoFinal), num(r.novo.precoFinal), num(r.deltaMensal)],
    ['Efeito em 12 meses', '', '', num(r.deltaAnual)],
  ]
  return linhas.map((l) => l.join(';')).join('\r\n')
}
