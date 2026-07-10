/**
 * Cronograma da transição 2023 → 2033 (e 2078), conforme EC 132/2023 e LC 214/2025.
 * `composicao` alimenta o gráfico de área empilhada: participação ilustrativa de cada
 * tributo na arrecadação sobre o consumo, assumindo substituição com receita constante.
 */

export interface FatoresAno {
  /** fator aplicado sobre as alíquotas de ICMS/ISS (1 = integrais, 0 = extintos) */
  fatorIcmsIss: number
  /** CBS vigente como fração da alíquota cheia (0,9% em 2026 ≈ teste) */
  cbsTeste?: number
  ibsTeste?: number
  cbsIntegral: boolean
  pisCofinsAtivos: boolean
  ipiAtivo: boolean
  isAtivo: boolean
}

export interface AnoTransicao {
  ano: number
  titulo: string
  fase: 'preparacao' | 'teste' | 'federal' | 'estadual-municipal' | 'pleno'
  resumo: string
  detalhes: string[]
  fatores: FatoresAno
  composicao: { cbs: number; ibs: number; is: number; federaisAntigos: number; icms: number; iss: number }
}

export const TRANSICAO: AnoTransicao[] = [
  {
    ano: 2023,
    titulo: 'A Emenda',
    fase: 'preparacao',
    resumo:
      'Depois de mais de 30 anos de tentativas, o Congresso promulga a EC 132/2023 em 20 de dezembro: o consumo passará a ser tributado por um IVA dual (CBS + IBS) e um Imposto Seletivo.',
    detalhes: [
      'Emenda Constitucional nº 132 promulgada em 20/12/2023.',
      'Cria o IBS (art. 156-A da CF), a CBS (art. 195, V) e o Imposto Seletivo (art. 153, VIII).',
      'Define princípios: simplicidade, transparência, justiça tributária, cooperação e defesa do meio ambiente.',
    ],
    fatores: { fatorIcmsIss: 1, cbsIntegral: false, pisCofinsAtivos: true, ipiAtivo: true, isAtivo: false },
    composicao: { cbs: 0, ibs: 0, is: 0, federaisAntigos: 40, icms: 52, iss: 8 },
  },
  {
    ano: 2024,
    titulo: 'A regulamentação',
    fase: 'preparacao',
    resumo:
      'O ano inteiro é dedicado a regulamentar a Emenda: o PLP 68/2024 (regras gerais do IBS, CBS e IS) é aprovado em dezembro; o PLP 108/2024 (Comitê Gestor do IBS) avança em paralelo.',
    detalhes: [
      'PLP 68/2024 aprovado pela Câmara e pelo Senado — vira a LC 214/2025.',
      'PLP 108/2024 disciplina o Comitê Gestor do IBS, o contencioso e o ITCMD.',
      'Definição da Cesta Básica Nacional, dos regimes diferenciados e do cashback.',
    ],
    fatores: { fatorIcmsIss: 1, cbsIntegral: false, pisCofinsAtivos: true, ipiAtivo: true, isAtivo: false },
    composicao: { cbs: 0, ibs: 0, is: 0, federaisAntigos: 40, icms: 52, iss: 8 },
  },
  {
    ano: 2025,
    titulo: 'A Lei',
    fase: 'preparacao',
    resumo:
      'A LC 214/2025 é sancionada em 16 de janeiro. Governo e empresas correm para adaptar sistemas: novos campos na nota fiscal eletrônica, cadastro dos regimes diferenciados e a criação do Comitê Gestor.',
    detalhes: [
      'Lei Complementar nº 214 sancionada em 16/01/2025.',
      'Detalha alíquota zero, reduções de 60% e 30%, regimes específicos, split payment e cashback.',
      'Documentos fiscais eletrônicos começam a ganhar os campos de CBS/IBS.',
    ],
    fatores: { fatorIcmsIss: 1, cbsIntegral: false, pisCofinsAtivos: true, ipiAtivo: true, isAtivo: false },
    composicao: { cbs: 0, ibs: 0, is: 0, federaisAntigos: 40, icms: 52, iss: 8 },
  },
  {
    ano: 2026,
    titulo: 'O ensaio geral',
    fase: 'teste',
    resumo:
      'Ano-teste: CBS de 0,9% e IBS de 0,1% passam a ser destacados nas notas fiscais. Quem cumprir as obrigações acessórias fica dispensado de recolher — o objetivo é calibrar sistemas e estatísticas, não arrecadar.',
    detalhes: [
      'CBS 0,9% + IBS 0,1% destacados em nota (compensáveis com PIS/Cofins).',
      'Dispensa de recolhimento para quem entrega as obrigações acessórias em dia.',
      'Empresas validam ERPs, cadastros e o cálculo "por fora" na prática.',
    ],
    fatores: { fatorIcmsIss: 1, cbsTeste: 0.009, ibsTeste: 0.001, cbsIntegral: false, pisCofinsAtivos: true, ipiAtivo: true, isAtivo: false },
    composicao: { cbs: 0.75, ibs: 0.25, is: 0, federaisAntigos: 39.2, icms: 52, iss: 7.8 },
  },
  {
    ano: 2027,
    titulo: 'A virada federal',
    fase: 'federal',
    resumo:
      'PIS e Cofins são extintos e a CBS entra com alíquota cheia (com desconto de 0,1 p.p. até 2028). O IPI é zerado — exceto para proteger a Zona Franca de Manaus — e o Imposto Seletivo começa a valer. Início do cashback da CBS.',
    detalhes: [
      'Extinção de PIS e Cofins; CBS integral (menos 0,1 p.p. em 2027–2028).',
      'IPI zerado, mantido apenas como proteção competitiva da ZFM.',
      'Imposto Seletivo passa a incidir sobre produtos prejudiciais à saúde e ao meio ambiente.',
      'Cashback da CBS para famílias do CadÚnico começa a operar.',
      'IBS segue simbólico: 0,05% estadual + 0,05% municipal.',
    ],
    fatores: { fatorIcmsIss: 1, cbsIntegral: true, ibsTeste: 0.001, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 37.6, ibs: 0.4, is: 2, federaisAntigos: 0, icms: 52, iss: 8 },
  },
  {
    ano: 2028,
    titulo: 'Consolidação federal',
    fase: 'federal',
    resumo:
      'Segundo ano do IVA federal pleno. CBS e IS rodam em velocidade de cruzeiro enquanto estados e municípios se preparam para a sua própria virada, marcada para 2029.',
    detalhes: [
      'CBS plena (ainda com o desconto de 0,1 p.p.) e IS em operação.',
      'ICMS e ISS seguem com alíquotas integrais.',
      'Comitê Gestor do IBS conclui a infraestrutura de arrecadação e devolução.',
    ],
    fatores: { fatorIcmsIss: 1, cbsIntegral: true, ibsTeste: 0.001, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 37.6, ibs: 0.4, is: 2, federaisAntigos: 0, icms: 52, iss: 8 },
  },
  {
    ano: 2029,
    titulo: 'Começa a fusão estadual–municipal',
    fase: 'estadual-municipal',
    resumo:
      'ICMS e ISS começam a encolher: valem 90% das alíquotas originais, e o IBS cresce na mesma proporção. Benefícios fiscais de ICMS são reduzidos gradualmente, com compensação via Fundo. Início do cashback do IBS.',
    detalhes: [
      'ICMS e ISS a 90% das alíquotas; IBS assume a diferença.',
      'Cashback do IBS passa a valer para famílias de baixa renda.',
      'Benefícios fiscais de ICMS em extinção gradual (Fundo de Compensação).',
    ],
    fatores: { fatorIcmsIss: 0.9, cbsIntegral: true, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 38, ibs: 6, is: 2, federaisAntigos: 0, icms: 46.8, iss: 7.2 },
  },
  {
    ano: 2030,
    titulo: 'Transição a 80%',
    fase: 'estadual-municipal',
    resumo: 'ICMS e ISS valem 80% das alíquotas originais; o IBS segue ocupando o espaço, ano após ano.',
    detalhes: ['ICMS/ISS a 80%; IBS proporcionalmente maior.'],
    fatores: { fatorIcmsIss: 0.8, cbsIntegral: true, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 38, ibs: 12, is: 2, federaisAntigos: 0, icms: 41.6, iss: 6.4 },
  },
  {
    ano: 2031,
    titulo: 'Transição a 70%',
    fase: 'estadual-municipal',
    resumo: 'ICMS e ISS a 70%. Empresas já operam majoritariamente sob a lógica do destino e do crédito amplo.',
    detalhes: ['ICMS/ISS a 70%; IBS proporcionalmente maior.'],
    fatores: { fatorIcmsIss: 0.7, cbsIntegral: true, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 38, ibs: 18, is: 2, federaisAntigos: 0, icms: 36.4, iss: 5.6 },
  },
  {
    ano: 2032,
    titulo: 'Transição a 60%',
    fase: 'estadual-municipal',
    resumo: 'Último ano de convivência: ICMS e ISS valem 60% das alíquotas originais antes da extinção definitiva.',
    detalhes: ['ICMS/ISS a 60%; IBS quase pleno.'],
    fatores: { fatorIcmsIss: 0.6, cbsIntegral: true, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 38, ibs: 24, is: 2, federaisAntigos: 0, icms: 31.2, iss: 4.8 },
  },
  {
    ano: 2033,
    titulo: 'O novo sistema, inteiro',
    fase: 'pleno',
    resumo:
      'ICMS e ISS deixam de existir. O consumo passa a ser tributado apenas por CBS + IBS (o IVA dual) e pelo Imposto Seletivo — cobrados no destino, por fora, com crédito amplo e cashback para a baixa renda.',
    detalhes: [
      'Extinção definitiva de ICMS e ISS.',
      'IBS em alíquota cheia, arrecadado pelo Comitê Gestor e distribuído no destino.',
      'Segue até 2078 apenas a transição federativa (repartição da receita entre entes).',
    ],
    fatores: { fatorIcmsIss: 0, cbsIntegral: true, pisCofinsAtivos: false, ipiAtivo: false, isAtivo: true },
    composicao: { cbs: 38, ibs: 60, is: 2, federaisAntigos: 0, icms: 0, iss: 0 },
  },
]

export const EPILOGO_2078 = {
  ano: 2078,
  titulo: 'Fim da transição federativa',
  resumo:
    'A repartição da arrecadação do IBS entre estados e municípios migra ao longo de 50 anos (2029–2078) da origem para o destino, suavizando perdas de quem hoje arrecada na origem.',
}

/** Anos disponíveis no simulador da calculadora. */
export const ANOS_SIMULAVEIS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
