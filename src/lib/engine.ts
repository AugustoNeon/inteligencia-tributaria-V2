/**
 * Motor da calculadora comparativa.
 *
 * Modelo (didático, premissas exibidas na interface):
 *  - O usuário informa o preço final AO CONSUMIDOR hoje (impostos embutidos).
 *  - Sistema atual: tributos "por dentro" — cada alíquota é fração do preço final.
 *  - Preço sem tributos B = preço × (1 − Σ alíquotas por dentro). Premissa de
 *    repasse integral: B não muda na troca de sistema.
 *  - Sistema novo: CBS/IBS "por fora" sobre B; nos anos de convivência
 *    (2027–2032) ICMS/ISS continuam por dentro com o fator do ano:
 *        P = B × (1 + tFora) / (1 − tDentro)
 *  - 2026 é ano-teste: destaque de 0,9% + 0,1% compensável — carga não muda.
 */

import type { CategoriaCalc, PerfilAtual } from '../data/categorias'
import { ALIQUOTA_REFERENCIA, CORES } from '../data/tributos'
import { TRANSICAO } from '../data/transicao'

export interface ItemImposto {
  id: string
  sigla: string
  valor: number
  cor: string
  sistema: 'antigo' | 'novo'
}

export interface Cenario {
  rotulo: string
  ano: number
  precoFinal: number
  precoSemImposto: number
  itens: ItemImposto[]
  totalImpostos: number
  /** fração do preço final */
  carga: number
  anoTeste?: boolean
}

export interface Comparativo {
  hoje: Cenario
  novo: Cenario
  deltaPreco: number
  deltaCarga: number
  aliquotaIvaEfetiva: number
}

const round2 = (v: number) => Math.round(v * 100) / 100

function cenario(rotulo: string, ano: number, precoFinal: number, itens: ItemImposto[], anoTeste = false): Cenario {
  const itensVisiveis = itens.filter((i) => i.valor > 0.004)
  const total = itensVisiveis.reduce((s, i) => s + i.valor, 0)
  return {
    rotulo,
    ano,
    precoFinal: round2(precoFinal),
    precoSemImposto: round2(precoFinal - total),
    itens: itensVisiveis.map((i) => ({ ...i, valor: round2(i.valor) })),
    totalImpostos: round2(total),
    carga: precoFinal > 0 ? total / precoFinal : 0,
    anoTeste,
  }
}

export function calcularHoje(precoFinal: number, perfil: PerfilAtual): Cenario {
  const itens: ItemImposto[] = [
    { id: 'icms', sigla: 'ICMS', valor: (perfil.icms ?? 0) * precoFinal, cor: CORES.icms, sistema: 'antigo' },
    { id: 'iss', sigla: 'ISS', valor: (perfil.iss ?? 0) * precoFinal, cor: CORES.iss, sistema: 'antigo' },
    { id: 'piscofins', sigla: 'PIS/Cofins', valor: perfil.pisCofins * precoFinal, cor: CORES.pisCofins, sistema: 'antigo' },
    { id: 'ipi', sigla: 'IPI', valor: (perfil.ipi ?? 0) * precoFinal, cor: CORES.ipi, sistema: 'antigo' },
  ]
  return cenario('Hoje', 2025, precoFinal, itens)
}

/** Alíquota do IVA dual (por fora) vigente no ano, já com a redução da categoria. */
export function aliquotasNoAno(ano: number, reducao: number) {
  const fat = TRANSICAO.find((t) => t.ano === ano)?.fatores ?? TRANSICAO[TRANSICAO.length - 1].fatores
  const mult = 1 - reducao
  // desconto de 0,1 p.p. da CBS em 2027–2028 (aplicado antes da redução proporcional)
  const cbsCheia = ano <= 2028 && fat.cbsIntegral ? ALIQUOTA_REFERENCIA.cbs - 0.001 : ALIQUOTA_REFERENCIA.cbs
  const cbs = fat.cbsIntegral ? cbsCheia * mult : 0
  const ibs =
    ano >= 2029
      ? ALIQUOTA_REFERENCIA.ibs * (1 - fat.fatorIcmsIss) * mult
      : fat.cbsIntegral
        ? (fat.ibsTeste ?? 0) * mult
        : 0
  return { cbs, ibs, fatorIcmsIss: fat.fatorIcmsIss, pisCofinsAtivos: fat.pisCofinsAtivos, ipiAtivo: fat.ipiAtivo }
}

export function calcularNoAno(precoHoje: number, categoria: CategoriaCalc, perfil: PerfilAtual, ano: number): Cenario {
  const tDentroHoje = (perfil.icms ?? 0) + (perfil.iss ?? 0) + perfil.pisCofins + (perfil.ipi ?? 0)
  const base = precoHoje * (1 - tDentroHoje)

  if (ano <= 2026) {
    // ano-teste: destaque compensável, carga idêntica à atual
    const c = calcularHoje(precoHoje, perfil)
    return { ...c, rotulo: `Em ${ano}`, ano, anoTeste: ano === 2026 }
  }

  const a = aliquotasNoAno(ano, categoria.reducao)
  const tFora = a.cbs + a.ibs
  const tDentroLegado = a.fatorIcmsIss * ((perfil.icms ?? 0) + (perfil.iss ?? 0))
  const precoNovo = (base * (1 + tFora)) / (1 - tDentroLegado)

  const itens: ItemImposto[] = [
    { id: 'cbs', sigla: 'CBS', valor: base * a.cbs, cor: CORES.cbs, sistema: 'novo' },
    { id: 'ibs', sigla: 'IBS', valor: base * a.ibs, cor: CORES.ibs, sistema: 'novo' },
    {
      id: 'icms',
      sigla: 'ICMS',
      valor: a.fatorIcmsIss * (perfil.icms ?? 0) * precoNovo,
      cor: CORES.icms,
      sistema: 'antigo',
    },
    { id: 'iss', sigla: 'ISS', valor: a.fatorIcmsIss * (perfil.iss ?? 0) * precoNovo, cor: CORES.iss, sistema: 'antigo' },
  ]
  return cenario(ano === 2033 ? 'Sistema pleno (2033)' : `Em ${ano}`, ano, precoNovo, itens)
}

export function comparar(precoHoje: number, categoria: CategoriaCalc, perfil: PerfilAtual, ano: number): Comparativo {
  const hoje = calcularHoje(precoHoje, perfil)
  const novo = calcularNoAno(precoHoje, categoria, perfil, ano)
  const aliq = ALIQUOTA_REFERENCIA.total * (1 - categoria.reducao)
  return {
    hoje,
    novo,
    deltaPreco: novo.precoFinal - hoje.precoFinal,
    deltaCarga: novo.carga - hoje.carga,
    aliquotaIvaEfetiva: aliq,
  }
}

/** Série p/ o gráfico "preço final ano a ano" da calculadora. */
export function trajetoriaPreco(precoHoje: number, categoria: CategoriaCalc, perfil: PerfilAtual) {
  const anos = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
  return anos.map((ano) => ({ ano, cenario: calcularNoAno(precoHoje, categoria, perfil, ano) }))
}
