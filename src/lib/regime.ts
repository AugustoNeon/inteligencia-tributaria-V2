/**
 * Onde o vendedor se encaixa no novo sistema — dentro ou fora do IVA.
 *
 * Faixas de receita anual (LC 214/2025):
 *  - Nanoempreendedor: até R$ 40,5 mil (metade do teto do MEI) — fora do IVA.
 *  - MEI: até R$ 81 mil — dentro do Simples, com recolhimento fixo.
 *  - Produtor rural: até R$ 3,6 mi — pode optar por não ser contribuinte.
 *  - Simples Nacional: até R$ 4,8 mi — CBS/IBS por dentro do DAS ou,
 *    por opção, no regime regular ("por fora") p/ transferir crédito integral.
 *  - Acima de R$ 4,8 mi: regime regular obrigatório.
 */

export const LIMITES_REGIME = {
  nanoempreendedor: 40_500,
  mei: 81_000,
  produtorRural: 3_600_000,
  simples: 4_800_000,
} as const

export interface OpcaoRegime {
  id: 'nano' | 'mei' | 'simples-dentro' | 'simples-fora' | 'rural-fora' | 'regular'
  rotulo: string
  dentroDoIva: boolean
  disponivel: boolean
  resumo: string
}

export function opcoesDoVendedor(receitaAnual: number, produtorRural = false): OpcaoRegime[] {
  const r = Math.max(receitaAnual, 0)
  return [
    {
      id: 'nano',
      rotulo: 'Nanoempreendedor',
      dentroDoIva: false,
      disponivel: r <= LIMITES_REGIME.nanoempreendedor,
      resumo:
        'Pessoa física com receita de até R$ 40,5 mil/ano fica fora do IVA: não recolhe CBS/IBS nem destaca imposto na nota. Clientes não recebem crédito.',
    },
    {
      id: 'mei',
      rotulo: 'MEI',
      dentroDoIva: true,
      disponivel: r <= LIMITES_REGIME.mei,
      resumo:
        'Até R$ 81 mil/ano: continua no Simples com recolhimento fixo mensal, que passa a incluir a parcela de CBS/IBS. O crédito ao cliente fica limitado ao valor efetivamente pago.',
    },
    {
      id: 'rural-fora',
      rotulo: 'Produtor rural não contribuinte',
      dentroDoIva: false,
      disponivel: produtorRural && r <= LIMITES_REGIME.produtorRural,
      resumo:
        'Produtor rural (PF ou PJ) com receita de até R$ 3,6 mi/ano pode optar por ficar fora do IVA; quem compra dele recebe um crédito presumido definido em ato anual.',
    },
    {
      id: 'simples-dentro',
      rotulo: 'Simples Nacional — por dentro',
      dentroDoIva: true,
      disponivel: r <= LIMITES_REGIME.simples,
      resumo:
        'Até R$ 4,8 mi/ano: CBS/IBS recolhidos dentro do DAS, na guia única de sempre. Simplicidade máxima — mas o cliente PJ só aproveita o crédito do que foi pago no DAS.',
    },
    {
      id: 'simples-fora',
      rotulo: 'Simples Nacional — IBS/CBS por fora',
      dentroDoIva: true,
      disponivel: r <= LIMITES_REGIME.simples,
      resumo:
        'O optante pode recolher só o CBS/IBS no regime regular, mantendo o resto no Simples. Costuma valer a pena no B2B: o cliente empresa recebe crédito integral.',
    },
    {
      id: 'regular',
      rotulo: 'Regime regular',
      dentroDoIva: true,
      disponivel: true,
      resumo:
        'Débito e crédito completos de CBS/IBS, com apuração própria. Obrigatório acima de R$ 4,8 mi/ano — e sempre uma opção para quem quer transferir crédito integral.',
    },
  ]
}

export interface ComparativoCredito {
  /** crédito integral: IBS/CBS destacados por fora no regime regular */
  porFora: number
  /** crédito limitado ao IBS/CBS efetivamente recolhido dentro do DAS */
  porDentro: number
  diferenca: number
}

/**
 * Crédito de CBS/IBS que o comprador PJ recebe a cada venda.
 * @param valorVenda  valor da venda sem o IVA (base do destaque por fora)
 * @param aliquotaIva alíquota efetiva de CBS+IBS da categoria (ex.: 0.265)
 * @param aliquotaDas parcela do DAS correspondente a CBS/IBS, como fração da receita
 */
export function compararCredito(valorVenda: number, aliquotaIva: number, aliquotaDas: number): ComparativoCredito {
  const porFora = valorVenda * aliquotaIva
  const porDentro = valorVenda * Math.min(aliquotaDas, aliquotaIva)
  return { porFora, porDentro, diferenca: porFora - porDentro }
}
