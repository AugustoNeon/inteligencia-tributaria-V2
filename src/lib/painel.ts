/**
 * Raio-X da família: combina os motores da cesta mensal e do cashback num
 * único retrato do sistema pleno (2033).
 *
 * O consumo mensal informado é distribuído por pesos ilustrativos entre as
 * categorias da cesta (data/cesta.ts) e as contas essenciais do cashback
 * (energia, água, gás, telecom) — pesos declarados na interface.
 * Efeito líquido = variação da cesta − devolução do cashback.
 */

import { CESTA_PADRAO } from '../data/cesta'
import { calcularCashback, type ResultadoCashback } from './cashback'
import { simularCesta, type ItemCestaValor, type ResultadoCesta } from './cesta-mensal'

/** Pesos do consumo mensal (somam 1 com PESOS_CONTAS — verificado em teste). */
export const PESOS_CESTA: Record<string, number> = {
  'cesta-basica': 0.22,
  'alimentos-gerais': 0.16,
  'produto-padrao': 0.14,
  medicamentos: 0.05,
  saude: 0.07,
  educacao: 0.08,
  'transporte-coletivo': 0.06,
  'servico-padrao': 0.075,
}

export const PESOS_CONTAS: Record<string, number> = {
  energia: 0.055,
  agua: 0.025,
  botijao: 0.02,
  telecom: 0.045,
}

export interface EntradaPainel {
  pessoas: number
  rendaFamiliar: number
  inscritoCadUnico: boolean
  /** consumo mensal total da família (cesta + contas essenciais) */
  consumo: number
  uf: string
  salarioMinimo: number
}

export interface ResultadoPainel {
  cesta: ResultadoCesta
  cashback: ResultadoCashback
  itensCesta: ItemCestaValor[]
  consumoCesta: number
  consumoContas: number
  /** variação mensal da cesta − cashback; negativo = a família sai ganhando */
  efeitoLiquidoMensal: number
  efeitoLiquidoAnual: number
}

export function simularPainel(e: EntradaPainel): ResultadoPainel {
  const itensCesta = CESTA_PADRAO.map((i) => ({
    categoriaId: i.categoriaId,
    rotulo: i.rotulo,
    valor: e.consumo * (PESOS_CESTA[i.categoriaId] ?? 0),
  }))
  const cesta = simularCesta(itensCesta, e.uf, 2033)

  const gastosContas = Object.fromEntries(Object.entries(PESOS_CONTAS).map(([id, p]) => [id, e.consumo * p]))
  // no cashback, "demais compras" = o que embute CBS/IBS na alíquota cheia
  const demais = e.consumo * (PESOS_CESTA['produto-padrao'] + PESOS_CESTA['servico-padrao'])
  const cashback = calcularCashback({
    pessoas: e.pessoas,
    rendaFamiliar: e.rendaFamiliar,
    inscritoCadUnico: e.inscritoCadUnico,
    salarioMinimo: e.salarioMinimo,
    gastos: gastosContas,
    demaisCompras: demais,
  })

  const consumoCesta = itensCesta.reduce((s, i) => s + i.valor, 0)
  const consumoContas = Object.values(gastosContas).reduce((s, v) => s + v, 0)
  const efeitoLiquidoMensal = cesta.deltaMensal - cashback.totalMensal

  return {
    cesta,
    cashback,
    itensCesta,
    consumoCesta,
    consumoContas,
    efeitoLiquidoMensal,
    efeitoLiquidoAnual: efeitoLiquidoMensal * 12,
  }
}
