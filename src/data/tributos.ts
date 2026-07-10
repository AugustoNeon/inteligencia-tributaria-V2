/**
 * Metadados dos tributos sobre consumo — sistema antigo e novo.
 * Cores seguem a codificação semântica do projeto (DESIGN.md):
 * família ferrugem/cobre = tributos em extinção; família petróleo = IVA dual;
 * violeta = Imposto Seletivo. Paleta validada p/ daltonismo (dataviz).
 */

export type Esfera = 'federal' | 'estadual' | 'municipal' | 'compartilhado'
export type Sistema = 'antigo' | 'novo'

export interface Tributo {
  sigla: string
  nome: string
  esfera: Esfera
  sistema: Sistema
  cor: string
  incide: string
  destino: string
}

/**
 * Referências de CSS custom properties definidas em tokens.css — assim os
 * gráficos trocam de paleta junto com o tema (claro/escuro), cada uma
 * validada para a própria superfície.
 */
export const CORES = {
  cbs: 'var(--cor-cbs)',
  ibs: 'var(--cor-ibs)',
  is: 'var(--cor-is)',
  pisCofins: 'var(--cor-piscofins)',
  ipi: 'var(--cor-ipi)',
  icms: 'var(--cor-icms)',
  iss: 'var(--cor-iss)',
  federaisAntigos: 'var(--cor-piscofins)',
} as const

export const TRIBUTOS_ANTIGOS: Tributo[] = [
  {
    sigla: 'PIS',
    nome: 'Programa de Integração Social',
    esfera: 'federal',
    sistema: 'antigo',
    cor: CORES.pisCofins,
    incide: 'Receita bruta das empresas (0,65% cumulativo ou 1,65% não cumulativo)',
    destino: 'Extinto em 2027, substituído pela CBS',
  },
  {
    sigla: 'Cofins',
    nome: 'Contribuição p/ Financiamento da Seguridade Social',
    esfera: 'federal',
    sistema: 'antigo',
    cor: CORES.pisCofins,
    incide: 'Receita bruta (3% cumulativo ou 7,6% não cumulativo)',
    destino: 'Extinta em 2027, substituída pela CBS',
  },
  {
    sigla: 'IPI',
    nome: 'Imposto sobre Produtos Industrializados',
    esfera: 'federal',
    sistema: 'antigo',
    cor: CORES.ipi,
    incide: 'Produtos industrializados (alíquotas por NCM)',
    destino: 'Alíquotas zeradas em 2027, exceto p/ preservar a Zona Franca de Manaus',
  },
  {
    sigla: 'ICMS',
    nome: 'Imposto sobre Circulação de Mercadorias e Serviços',
    esfera: 'estadual',
    sistema: 'antigo',
    cor: CORES.icms,
    incide: 'Mercadorias, energia, transporte interestadual, comunicação (17%–22% + regimes)',
    destino: 'Reduzido 10 p.p. ao ano entre 2029 e 2032; extinto em 2033',
  },
  {
    sigla: 'ISS',
    nome: 'Imposto sobre Serviços',
    esfera: 'municipal',
    sistema: 'antigo',
    cor: CORES.iss,
    incide: 'Serviços de qualquer natureza (2%–5%)',
    destino: 'Reduzido junto com o ICMS; extinto em 2033',
  },
]

export const TRIBUTOS_NOVOS: Tributo[] = [
  {
    sigla: 'CBS',
    nome: 'Contribuição sobre Bens e Serviços',
    esfera: 'federal',
    sistema: 'novo',
    cor: CORES.cbs,
    incide: 'Bens e serviços em geral — IVA federal, não cumulativo, por fora',
    destino: 'Integral a partir de 2027 (alíquota de referência estimada: 8,8%)',
  },
  {
    sigla: 'IBS',
    nome: 'Imposto sobre Bens e Serviços',
    esfera: 'compartilhado',
    sistema: 'novo',
    cor: CORES.ibs,
    incide: 'Bens e serviços em geral — IVA de estados e municípios, cobrado no destino',
    destino: 'Cresce de 2029 a 2033 (alíquota de referência estimada: 17,7%)',
  },
  {
    sigla: 'IS',
    nome: 'Imposto Seletivo',
    esfera: 'federal',
    sistema: 'novo',
    cor: CORES.is,
    incide: 'Bens e serviços prejudiciais à saúde ou ao meio ambiente (cigarros, bebidas alcoólicas e açucaradas, veículos, apostas, minérios extraídos)',
    destino: 'Vigente a partir de 2027 — o "imposto do pecado"',
  },
]

/** Alíquota de referência estimada do IVA dual (teto de trava da LC 214/2025). */
export const ALIQUOTA_REFERENCIA = {
  total: 0.265,
  cbs: 0.088,
  ibs: 0.177,
  fonte:
    'Estimativa do Ministério da Fazenda; a LC 214/2025 cria mecanismo de trava para que a soma não ultrapasse 26,5%.',
} as const
