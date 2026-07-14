/**
 * "Você está aqui" — posiciona a data real dentro da transição da reforma.
 * Funções puras (a data entra como argumento) para serem testáveis.
 */

import { TRANSICAO } from '../data/transicao'

/** Promulgação da EC 132 — início do relógio da transição. */
export const INICIO_TRANSICAO = new Date(2023, 11, 20)
/** 1º de janeiro de 2033 — sistema pleno. */
export const FIM_TRANSICAO = new Date(2033, 0, 1)

const DIA_MS = 86_400_000

/** Próximas viradas de fase relevantes (entram em vigor em 1º de janeiro). */
export interface Marco {
  ano: number
  rotulo: string
}

export const MARCOS: Marco[] = [
  { ano: 2026, rotulo: 'o ano-teste (CBS 0,9% + IBS 0,1% destacados em nota)' },
  { ano: 2027, rotulo: 'a virada federal — CBS plena, fim de PIS/Cofins' },
  { ano: 2029, rotulo: 'o início da migração ICMS/ISS → IBS' },
  { ano: 2033, rotulo: 'o sistema pleno — só CBS + IBS + IS' },
]

/** Ano da transição correspondente à data (2023–2033, com clamp nas pontas). */
export function anoDaTransicao(hoje: Date): number {
  const primeiro = TRANSICAO[0].ano
  const ultimo = TRANSICAO[TRANSICAO.length - 1].ano
  return Math.min(Math.max(hoje.getFullYear(), primeiro), ultimo)
}

/** Próxima virada de fase depois da data — null quando o sistema já é pleno. */
export function proximoMarco(hoje: Date): { marco: Marco; dias: number } | null {
  for (const marco of MARCOS) {
    const vigor = new Date(marco.ano, 0, 1)
    if (vigor.getTime() > hoje.getTime()) {
      return { marco, dias: Math.ceil((vigor.getTime() - hoje.getTime()) / DIA_MS) }
    }
  }
  return null
}

/** Fração percorrida da transição (EC 132 → sistema pleno), com clamp em 0–1. */
export function progressoTransicao(hoje: Date): number {
  const total = FIM_TRANSICAO.getTime() - INICIO_TRANSICAO.getTime()
  const decorrido = hoje.getTime() - INICIO_TRANSICAO.getTime()
  return Math.min(Math.max(decorrido / total, 0), 1)
}

/** 14/07/2026 → "14 de julho de 2026" */
export const dataLonga = (d: Date) =>
  d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
