/**
 * Motor do simulador de cashback (sistema pleno, 2033).
 * Premissa: os preços informados já embutem CBS + IBS na alíquota padrão
 * (26,5% por fora ⇒ 20,95% do preço). A devolução aplica os percentuais
 * mínimos da LC 214/2025 sobre o imposto efetivamente embutido.
 */

import { ALIQUOTA_REFERENCIA } from '../data/tributos'
import { DEMAIS_CONSUMO, ESSENCIAIS } from '../data/cashback'

export interface EntradaCashback {
  pessoas: number
  rendaFamiliar: number
  inscritoCadUnico: boolean
  salarioMinimo: number
  /** gasto mensal por categoria essencial (id → R$) */
  gastos: Record<string, number>
  /** demais compras tributadas no mês */
  demaisCompras: number
}

export interface LinhaCashback {
  id: string
  rotulo: string
  gasto: number
  cbsEmbutida: number
  ibsEmbutido: number
  devolucao: number
  regra: string
}

export interface ResultadoCashback {
  elegivel: boolean
  rendaPerCapita: number
  limite: number
  linhas: LinhaCashback[]
  impostoEmbutidoTotal: number
  totalMensal: number
  totalAnual: number
  /** devolução como fração da renda familiar */
  pesoNaRenda: number
}

const T = ALIQUOTA_REFERENCIA.total
const shareCBS = ALIQUOTA_REFERENCIA.cbs / (1 + T)
const shareIBS = ALIQUOTA_REFERENCIA.ibs / (1 + T)

export function calcularCashback(e: EntradaCashback): ResultadoCashback {
  const rendaPerCapita = e.pessoas > 0 ? e.rendaFamiliar / e.pessoas : Infinity
  const limite = e.salarioMinimo / 2
  const elegivel = e.inscritoCadUnico && rendaPerCapita <= limite

  const linhas: LinhaCashback[] = ESSENCIAIS.map((c) => {
    const gasto = e.gastos[c.id] ?? 0
    const cbsEmbutida = gasto * shareCBS
    const ibsEmbutido = gasto * shareIBS
    return {
      id: c.id,
      rotulo: c.rotulo,
      gasto,
      cbsEmbutida,
      ibsEmbutido,
      devolucao: cbsEmbutida * c.pctCBS + ibsEmbutido * c.pctIBS,
      regra: `${c.pctCBS * 100}% da CBS + ${c.pctIBS * 100}% do IBS`,
    }
  })

  const cbsDemais = e.demaisCompras * shareCBS
  const ibsDemais = e.demaisCompras * shareIBS
  linhas.push({
    id: 'demais',
    rotulo: DEMAIS_CONSUMO.rotulo,
    gasto: e.demaisCompras,
    cbsEmbutida: cbsDemais,
    ibsEmbutido: ibsDemais,
    devolucao: (cbsDemais + ibsDemais) * DEMAIS_CONSUMO.pctCBS,
    regra: '20% da CBS + 20% do IBS',
  })

  const totalMensal = elegivel ? linhas.reduce((s, l) => s + l.devolucao, 0) : 0
  const impostoEmbutidoTotal = linhas.reduce((s, l) => s + l.cbsEmbutida + l.ibsEmbutido, 0)

  return {
    elegivel,
    rendaPerCapita,
    limite,
    linhas,
    impostoEmbutidoTotal,
    totalMensal,
    totalAnual: totalMensal * 12,
    pesoNaRenda: e.rendaFamiliar > 0 ? totalMensal / e.rendaFamiliar : 0,
  }
}
