/**
 * Categorias da calculadora comparativa.
 *
 * `atual` traz as alíquotas típicas do sistema atual expressas "por dentro"
 * (fração do preço final ao consumidor). São valores de referência editáveis
 * na interface — ICMS varia por estado, ISS por município.
 *
 * `reducao` é a redução do IVA dual no novo sistema (LC 214/2025):
 * 0 = alíquota padrão · 0.3 = redução de 30% · 0.6 = redução de 60% · 1 = alíquota zero.
 */

export interface PerfilAtual {
  /** ICMS por dentro (fração do preço final) */
  icms?: number
  /** ISS por dentro */
  iss?: number
  /** PIS/Cofins por dentro (3,65% cumulativo ou 9,25% não cumulativo) */
  pisCofins: number
  /** IPI aproximado por dentro */
  ipi?: number
}

export interface CategoriaCalc {
  id: string
  rotulo: string
  grupo: 'Produtos' | 'Serviços' | 'Regimes favorecidos'
  descricao: string
  atual: PerfilAtual
  reducao: 0 | 0.3 | 0.6 | 1
  refLegal: string
  notas?: string[]
}

export const CATEGORIAS: CategoriaCalc[] = [
  {
    id: 'produto-padrao',
    rotulo: 'Produto em geral (comércio)',
    grupo: 'Produtos',
    descricao: 'Mercadoria comum vendida no varejo, sem regime especial.',
    atual: { icms: 0.18, pisCofins: 0.0925 },
    reducao: 0,
    refLegal: 'LC 214/2025 — alíquota padrão (referência estimada de 26,5%)',
  },
  {
    id: 'produto-industrializado',
    rotulo: 'Produto industrializado (com IPI)',
    grupo: 'Produtos',
    descricao: 'Bem industrializado sujeito a IPI (ex.: eletrodomésticos).',
    atual: { icms: 0.18, pisCofins: 0.0925, ipi: 0.05 },
    reducao: 0,
    refLegal: 'LC 214/2025 — alíquota padrão; IPI zerado a partir de 2027 (exceto ZFM)',
  },
  {
    id: 'cesta-basica',
    rotulo: 'Cesta Básica Nacional',
    grupo: 'Regimes favorecidos',
    descricao: 'Arroz, feijão, leite, pães, carnes, café e demais itens do Anexo I da LC 214.',
    atual: { icms: 0.07, pisCofins: 0 },
    reducao: 1,
    refLegal: 'EC 132/2023, art. 8º · LC 214/2025, Anexo I (alíquota zero)',
    notas: [
      'PIS/Cofins da cesta já é desonerado hoje; o ICMS varia bastante por estado (média usada: 7%).',
      'No novo sistema a alíquota é zero — e por isso não gera cashback (não há imposto a devolver).',
    ],
  },
  {
    id: 'medicamentos',
    rotulo: 'Medicamentos',
    grupo: 'Regimes favorecidos',
    descricao: 'Medicamentos em geral (redução de 60%); uma lista específica tem alíquota zero.',
    atual: { icms: 0.18, pisCofins: 0.0925 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60%; lista com alíquota zero em anexo próprio',
    notas: ['Parte dos medicamentos (ex.: tratamento de câncer e doenças raras) fica com alíquota zero.'],
  },
  {
    id: 'servico-padrao',
    rotulo: 'Serviço em geral (consumidor final)',
    grupo: 'Serviços',
    descricao: 'Serviço prestado a pessoa física, sem regime especial (ex.: academia, salão, oficina).',
    atual: { iss: 0.05, pisCofins: 0.0365 },
    reducao: 0,
    refLegal: 'LC 214/2025 — alíquota padrão',
    notas: ['É o caso com maior alta potencial de carga: de ~8,7% para ~21% do preço final.'],
  },
  {
    id: 'profissional-liberal',
    rotulo: 'Profissional liberal regulamentado',
    grupo: 'Serviços',
    descricao: 'Advogados, contadores, engenheiros, médicos e demais profissões regulamentadas.',
    atual: { iss: 0.05, pisCofins: 0.0365 },
    reducao: 0.3,
    refLegal: 'LC 214/2025 — redução de 30% p/ profissões intelectuais regulamentadas',
  },
  {
    id: 'saude',
    rotulo: 'Serviços de saúde',
    grupo: 'Regimes favorecidos',
    descricao: 'Consultas, exames, hospitais e planos (planos têm regime específico próprio).',
    atual: { iss: 0.03, pisCofins: 0.0365 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60% p/ serviços de saúde',
  },
  {
    id: 'educacao',
    rotulo: 'Serviços de educação',
    grupo: 'Regimes favorecidos',
    descricao: 'Escolas, cursos e ensino superior (ProUni tem alíquota zero).',
    atual: { iss: 0.03, pisCofins: 0.0365 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60% p/ serviços de educação',
  },
  {
    id: 'transporte-coletivo',
    rotulo: 'Transporte público coletivo',
    grupo: 'Regimes favorecidos',
    descricao: 'Transporte coletivo de passageiros rodoviário, ferroviário, hidroviário e metroviário.',
    atual: { iss: 0.05, pisCofins: 0.0365 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60%; serviços urbanos podem ter alíquota zero por lei específica',
  },
  {
    id: 'insumos-agro',
    rotulo: 'Insumos agropecuários',
    grupo: 'Regimes favorecidos',
    descricao: 'Fertilizantes, defensivos e demais insumos do Anexo IX.',
    atual: { icms: 0.12, pisCofins: 0.0925 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60% p/ insumos agropecuários e aquícolas',
    notas: ['Produtor rural com receita até R$ 3,6 mi/ano pode ficar fora do IVA (não contribuinte).'],
  },
  {
    id: 'alimentos-gerais',
    rotulo: 'Alimentos fora da cesta básica',
    grupo: 'Regimes favorecidos',
    descricao: 'Alimentos destinados ao consumo humano que não integram a Cesta Básica Nacional.',
    atual: { icms: 0.18, pisCofins: 0.0925 },
    reducao: 0.6,
    refLegal: 'LC 214/2025 — redução de 60% p/ alimentos de consumo humano listados',
  },
]

/** Ponto de partida da UI. */
export const CATEGORIA_PADRAO = 'produto-padrao'
