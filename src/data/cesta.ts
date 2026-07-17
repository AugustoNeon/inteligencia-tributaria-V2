/**
 * Itens padrão da cesta mensal — cada item aponta para uma categoria da
 * calculadora (que carrega o perfil tributário atual e a redução do IVA).
 * Os valores são apenas um ponto de partida editável, não uma POF.
 */

export interface ItemCestaPadrao {
  /** id da categoria correspondente em data/categorias.ts */
  categoriaId: string
  /** rótulo na linguagem do orçamento doméstico */
  rotulo: string
  valorPadrao: number
}

export const CESTA_PADRAO: ItemCestaPadrao[] = [
  { categoriaId: 'cesta-basica', rotulo: 'Mercado: cesta básica', valorPadrao: 600 },
  { categoriaId: 'alimentos-gerais', rotulo: 'Mercado: outros alimentos', valorPadrao: 450 },
  { categoriaId: 'produto-padrao', rotulo: 'Vestuário, casa e higiene', valorPadrao: 400 },
  { categoriaId: 'medicamentos', rotulo: 'Medicamentos', valorPadrao: 150 },
  { categoriaId: 'saude', rotulo: 'Saúde: consultas e exames', valorPadrao: 250 },
  { categoriaId: 'educacao', rotulo: 'Educação: escola e cursos', valorPadrao: 400 },
  { categoriaId: 'transporte-coletivo', rotulo: 'Transporte público', valorPadrao: 180 },
  { categoriaId: 'servico-padrao', rotulo: 'Serviços: academia, salão, lazer', valorPadrao: 250 },
]

/** Perfis de orçamento — um toque preenche a cesta inteira (tudo segue editável). */
export interface PerfilCesta {
  id: string
  rotulo: string
  descricao: string
  /** categoriaId → R$/mês */
  valores: Record<string, number>
}

export const PERFIS_CESTA: PerfilCesta[] = [
  {
    id: 'essencial',
    rotulo: 'Essencial',
    descricao: 'R$ 1.300/mês concentrados no básico: mercado, remédio e transporte',
    valores: {
      'cesta-basica': 500,
      'alimentos-gerais': 250,
      'produto-padrao': 200,
      medicamentos: 80,
      saude: 0,
      educacao: 0,
      'transporte-coletivo': 220,
      'servico-padrao': 50,
    },
  },
  {
    id: 'familiar',
    rotulo: 'Familiar',
    descricao: 'R$ 2.680/mês distribuídos entre mercado, saúde, escola e lazer',
    valores: Object.fromEntries(CESTA_PADRAO.map((i) => [i.categoriaId, i.valorPadrao])),
  },
  {
    id: 'ampla',
    rotulo: 'Ampla',
    descricao: 'R$ 6.200/mês com peso maior em serviços: escola particular, plano e lazer',
    valores: {
      'cesta-basica': 900,
      'alimentos-gerais': 900,
      'produto-padrao': 1000,
      medicamentos: 250,
      saude: 700,
      educacao: 1500,
      'transporte-coletivo': 100,
      'servico-padrao': 850,
    },
  },
]
