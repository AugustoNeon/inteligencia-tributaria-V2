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
