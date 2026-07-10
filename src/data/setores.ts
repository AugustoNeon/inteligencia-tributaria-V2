/**
 * Impacto estimado por setor: carga tributária sobre o preço final ao consumidor,
 * hoje vs. sistema pleno (2033). Estimativas ilustrativas e simplificadas — regime
 * regular (fora do Simples), sem considerar créditos ao longo da cadeia nem repasses.
 */

export interface Setor {
  id: string
  nome: string
  /** carga atual estimada, fração do preço final */
  hoje: number
  /** carga no sistema pleno (alíquota de referência × redução, por fora convertida) */
  novo: number
  leitura: string
  premissa: string
}

const t = (aliquota: number) => aliquota / (1 + aliquota)

export const SETORES: Setor[] = [
  {
    id: 'industria',
    nome: 'Indústria',
    hoje: 0.31,
    novo: t(0.265),
    leitura: 'Tende a pagar menos: hoje acumula IPI, ICMS e PIS/Cofins com créditos incompletos ao longo da cadeia.',
    premissa: 'Hoje: ICMS 18% + PIS/Cofins 9,25% + IPI ~4% (por dentro). Novo: alíquota padrão de 26,5% por fora.',
  },
  {
    id: 'comercio',
    nome: 'Comércio varejista',
    hoje: 0.2725,
    novo: t(0.265),
    leitura: 'Impacto próximo do neutro, com ganho de simplicidade e fim da substituição tributária.',
    premissa: 'Hoje: ICMS 18% + PIS/Cofins 9,25%. Novo: alíquota padrão.',
  },
  {
    id: 'servicos',
    nome: 'Serviços ao consumidor',
    hoje: 0.0865,
    novo: t(0.265),
    leitura: 'Maior alta potencial: sai de ISS + PIS/Cofins cumulativo para a alíquota padrão do IVA — mitigada quando o cliente é empresa (que agora toma crédito).',
    premissa: 'Hoje: ISS 5% + PIS/Cofins 3,65%. Novo: alíquota padrão.',
  },
  {
    id: 'liberais',
    nome: 'Profissionais liberais',
    hoje: 0.0865,
    novo: t(0.265 * 0.7),
    leitura: 'Alta amortecida pela redução de 30% para profissões regulamentadas.',
    premissa: 'Hoje: ISS 5% + PIS/Cofins 3,65%. Novo: 26,5% × 0,70 = 18,55% por fora.',
  },
  {
    id: 'saude-educacao',
    nome: 'Saúde e educação',
    hoje: 0.0665,
    novo: t(0.265 * 0.4),
    leitura: 'Redução de 60% na alíquota segura o impacto; ProUni e parte dos medicamentos ficam em zero.',
    premissa: 'Hoje: ISS 3% + PIS/Cofins 3,65%. Novo: 26,5% × 0,40 = 10,6% por fora.',
  },
  {
    id: 'agro',
    nome: 'Agropecuária',
    hoje: 0.19,
    novo: t(0.265 * 0.4),
    leitura: 'Insumos com redução de 60% e produtor rural menor fora do IVA tendem a baratear a cadeia de alimentos.',
    premissa: 'Hoje: ICMS ~12% + PIS/Cofins 9,25% sobre insumos. Novo: redução de 60%.',
  },
  {
    id: 'cesta',
    nome: 'Cesta básica',
    hoje: 0.065,
    novo: 0,
    leitura: 'Alíquota zero nacional substitui a colcha de retalhos de isenções estaduais.',
    premissa: 'Hoje: ICMS médio ~7% (varia por estado); PIS/Cofins já desonerado. Novo: alíquota zero.',
  },
]

export const NOTA_SETORES =
  'Estimativas didáticas por perfil típico — não substituem análise contábil. Contribuintes do Simples Nacional seguem regras próprias; setores com regime específico (combustíveis, serviços financeiros, imóveis, planos de saúde) não estão representados.'
