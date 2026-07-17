/**
 * Faixas de renda ilustrativas p/ a curva "quem paga mais".
 *
 * NÃO são microdados da POF/IBGE: são perfis construídos para este site,
 * com duas premissas declaradas na interface —
 *  1. a fração da renda consumida no mês cai conforme a renda sobe;
 *  2. a composição do consumo desloca de alimentos/contas básicas
 *     (rendas menores) para serviços como educação e saúde (rendas maiores).
 *
 * `pesos` distribui o consumo mensal entre as categorias da cesta
 * (data/cesta.ts) e as contas essenciais do cashback (data/cashback.ts);
 * os pesos de cada faixa somam 1 (verificado em teste).
 */

export interface FaixaRenda {
  id: string
  /** rótulo curto do eixo (renda familiar mensal) */
  rotulo: string
  /** renda familiar mensal (família de 4 pessoas) */
  rendaFamiliar: number
  pessoas: number
  /** fração da renda consumida no mês */
  fracaoConsumo: number
  /** categoriaId (cesta) ou id de conta essencial (cashback) → fração do consumo */
  pesos: Record<string, number>
}

export const FAIXAS_RENDA: FaixaRenda[] = [
  {
    id: 'f1',
    rotulo: 'R$ 1,6 mil',
    rendaFamiliar: 1_600,
    pessoas: 4,
    fracaoConsumo: 1,
    pesos: {
      'cesta-basica': 0.3,
      'alimentos-gerais': 0.14,
      'produto-padrao': 0.12,
      medicamentos: 0.05,
      saude: 0.01,
      educacao: 0.01,
      'transporte-coletivo': 0.09,
      'servico-padrao': 0.03,
      energia: 0.1,
      agua: 0.05,
      botijao: 0.05,
      telecom: 0.05,
    },
  },
  {
    id: 'f2',
    rotulo: 'R$ 3,2 mil',
    rendaFamiliar: 3_200,
    pessoas: 4,
    fracaoConsumo: 0.95,
    pesos: {
      'cesta-basica': 0.26,
      'alimentos-gerais': 0.15,
      'produto-padrao': 0.13,
      medicamentos: 0.05,
      saude: 0.02,
      educacao: 0.03,
      'transporte-coletivo': 0.08,
      'servico-padrao': 0.05,
      energia: 0.09,
      agua: 0.04,
      botijao: 0.04,
      telecom: 0.06,
    },
  },
  {
    id: 'f3',
    rotulo: 'R$ 5 mil',
    rendaFamiliar: 5_000,
    pessoas: 4,
    fracaoConsumo: 0.85,
    pesos: {
      'cesta-basica': 0.22,
      'alimentos-gerais': 0.16,
      'produto-padrao': 0.14,
      medicamentos: 0.05,
      saude: 0.04,
      educacao: 0.06,
      'transporte-coletivo': 0.07,
      'servico-padrao': 0.07,
      energia: 0.08,
      agua: 0.035,
      botijao: 0.025,
      telecom: 0.05,
    },
  },
  {
    id: 'f4',
    rotulo: 'R$ 9,5 mil',
    rendaFamiliar: 9_500,
    pessoas: 4,
    fracaoConsumo: 0.7,
    pesos: {
      'cesta-basica': 0.17,
      'alimentos-gerais': 0.16,
      'produto-padrao': 0.15,
      medicamentos: 0.05,
      saude: 0.07,
      educacao: 0.1,
      'transporte-coletivo': 0.05,
      'servico-padrao': 0.1,
      energia: 0.07,
      agua: 0.03,
      botijao: 0.01,
      telecom: 0.04,
    },
  },
  {
    id: 'f5',
    rotulo: 'R$ 19 mil',
    rendaFamiliar: 19_000,
    pessoas: 4,
    fracaoConsumo: 0.55,
    pesos: {
      'cesta-basica': 0.12,
      'alimentos-gerais': 0.15,
      'produto-padrao': 0.16,
      medicamentos: 0.05,
      saude: 0.1,
      educacao: 0.14,
      'transporte-coletivo': 0.03,
      'servico-padrao': 0.14,
      energia: 0.055,
      agua: 0.025,
      botijao: 0.005,
      telecom: 0.025,
    },
  },
  {
    id: 'f6',
    rotulo: 'R$ 40 mil',
    rendaFamiliar: 40_000,
    pessoas: 4,
    fracaoConsumo: 0.42,
    pesos: {
      'cesta-basica': 0.08,
      'alimentos-gerais': 0.13,
      'produto-padrao': 0.17,
      medicamentos: 0.05,
      saude: 0.13,
      educacao: 0.17,
      'transporte-coletivo': 0.02,
      'servico-padrao': 0.17,
      energia: 0.045,
      agua: 0.02,
      botijao: 0,
      telecom: 0.015,
    },
  },
]
