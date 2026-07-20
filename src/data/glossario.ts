/** Glossário da Reforma Tributária — termos pesquisáveis, agrupados por tema. */

export type CategoriaGlossario = 'fundamentos' | 'aliquotas' | 'consumidor' | 'empresas' | 'federacao'

export interface CategoriaGlossarioInfo {
  id: CategoriaGlossario
  rotulo: string
  resumo: string
}

/** Ordem de exibição no índice lateral e nas seções. */
export const CATEGORIAS_GLOSSARIO: CategoriaGlossarioInfo[] = [
  { id: 'fundamentos', rotulo: 'Fundamentos', resumo: 'Os conceitos que sustentam o novo sistema.' },
  { id: 'aliquotas', rotulo: 'Alíquotas e regimes', resumo: 'Quanto se paga e quem paga menos.' },
  { id: 'consumidor', rotulo: 'Para o consumidor', resumo: 'O que muda no bolso das famílias.' },
  { id: 'empresas', rotulo: 'Para quem vende', resumo: 'Regras para negócios e prestadores.' },
  { id: 'federacao', rotulo: 'Cronograma e federação', resumo: 'Como estados e municípios entram na transição.' },
]

export interface Termo {
  termo: string
  categoria: CategoriaGlossario
  definicao: string
  relacionados?: string[]
}

export const GLOSSARIO: Termo[] = [
  {
    termo: 'IVA dual',
    categoria: 'fundamentos',
    definicao:
      'Modelo brasileiro de Imposto sobre Valor Agregado dividido em dois: a CBS (federal) e o IBS (estados e municípios). Ambos compartilham as mesmas regras — base ampla, crédito integral e cobrança no destino.',
    relacionados: ['CBS', 'IBS'],
  },
  {
    termo: 'CBS',
    categoria: 'fundamentos',
    definicao:
      'Contribuição sobre Bens e Serviços, o IVA federal. Substitui PIS e Cofins a partir de 2027. Alíquota de referência estimada em 8,8%.',
    relacionados: ['IVA dual', 'Alíquota de referência'],
  },
  {
    termo: 'IBS',
    categoria: 'fundamentos',
    definicao:
      'Imposto sobre Bens e Serviços, o IVA de estados e municípios. Substitui ICMS e ISS gradualmente entre 2029 e 2033. Alíquota de referência estimada em 17,7%, arrecadada pelo Comitê Gestor e distribuída ao destino.',
    relacionados: ['IVA dual', 'Comitê Gestor do IBS', 'Princípio do destino'],
  },
  {
    termo: 'Imposto Seletivo (IS)',
    categoria: 'fundamentos',
    definicao:
      'O "imposto do pecado": incide uma única vez sobre bens e serviços prejudiciais à saúde ou ao meio ambiente — cigarros, bebidas alcoólicas, bebidas açucaradas, veículos, apostas e minérios extraídos.',
  },
  {
    termo: 'Não cumulatividade plena',
    categoria: 'fundamentos',
    definicao:
      'Tudo o que a empresa compra para a atividade gera crédito do imposto pago na etapa anterior. Acaba o efeito cascata (imposto sobre imposto) que encarece a produção no sistema atual.',
    relacionados: ['Resíduo tributário'],
  },
  {
    termo: 'Resíduo tributário',
    categoria: 'fundamentos',
    definicao:
      'Imposto "escondido" no preço porque alguma etapa da cadeia não gerou crédito. É o que a não cumulatividade plena elimina.',
  },
  {
    termo: 'Princípio do destino',
    categoria: 'fundamentos',
    definicao:
      'O imposto pertence ao lugar onde o bem é consumido, não onde é produzido. Acaba o incentivo à guerra fiscal entre estados e municípios.',
    relacionados: ['Guerra fiscal'],
  },
  {
    termo: 'Guerra fiscal',
    categoria: 'fundamentos',
    definicao:
      'Disputa entre estados/municípios que concedem benefícios de ICMS/ISS para atrair empresas. Perde a razão de existir com a cobrança no destino; benefícios existentes são compensados por fundo até 2032.',
  },
  {
    termo: 'Imposto "por fora"',
    categoria: 'fundamentos',
    definicao:
      'CBS e IBS são calculados sobre o preço sem imposto e destacados separadamente na nota — como nos EUA e na Europa. Hoje, ICMS/ISS/PIS/Cofins são "por dentro": escondidos no próprio preço, o que infla a alíquota real.',
  },
  {
    termo: 'Alíquota de referência',
    categoria: 'aliquotas',
    definicao:
      'Alíquota calculada pelo Senado (com base técnica da Receita/Tribunal de Contas) para manter a arrecadação constante na troca de sistema. Estimativa oficial: ~26,5% somando CBS e IBS. A LC 214 cria uma "trava": se passar disso, o governo deve propor cortes de benefícios.',
    relacionados: ['Trava de 26,5%'],
  },
  {
    termo: 'Trava de 26,5%',
    categoria: 'aliquotas',
    definicao:
      'Mecanismo da LC 214/2025: se a soma das alíquotas de referência de CBS e IBS superar 26,5% em 2031 (avaliação para 2033), o Executivo deve enviar projeto reduzindo regimes favorecidos para caber no teto.',
  },
  {
    termo: 'Cesta Básica Nacional',
    categoria: 'aliquotas',
    definicao:
      'Lista única de alimentos essenciais (Anexo I da LC 214/2025) com alíquota zero de CBS e IBS em todo o país — arroz, feijão, leites, pães, carnes, café, frutas e hortaliças, entre outros.',
  },
  {
    termo: 'Regimes diferenciados',
    categoria: 'aliquotas',
    definicao:
      'Setores com alíquota reduzida em 60% (saúde, educação, medicamentos, transporte coletivo, insumos agropecuários, cultura, alimentos) ou 30% (profissões intelectuais regulamentadas), além das alíquotas zero.',
  },
  {
    termo: 'Regimes específicos',
    categoria: 'aliquotas',
    definicao:
      'Setores com regras próprias de base ou alíquota por natureza da atividade: combustíveis (monofásico), serviços financeiros, planos de saúde, apostas, imóveis, cooperativas, entre outros.',
  },
  {
    termo: 'Cashback',
    categoria: 'consumidor',
    definicao:
      'Devolução personalizada de imposto para famílias do CadÚnico com renda por pessoa de até meio salário mínimo: 100% da CBS e no mínimo 20% do IBS em energia, água, gás e telecomunicações; 20% de ambos nas demais compras.',
    relacionados: ['CadÚnico'],
  },
  {
    termo: 'CadÚnico',
    categoria: 'consumidor',
    definicao:
      'Cadastro Único para Programas Sociais do Governo Federal — porta de entrada do Bolsa Família e critério de elegibilidade do cashback.',
  },
  {
    termo: 'Split payment',
    categoria: 'empresas',
    definicao:
      'Na liquidação do pagamento (ex.: cartão ou Pix), a parcela do imposto vai direto para o fisco, sem passar pelo caixa do vendedor. Reduz sonegação e inadimplência tributária.',
  },
  {
    termo: 'Simples Nacional',
    categoria: 'empresas',
    definicao:
      'Continua existindo. O optante pode recolher CBS/IBS dentro do Simples (sem repassar crédito integral) ou "por fora", no regime regular, para transferir crédito cheio a clientes empresas.',
  },
  {
    termo: 'Nanoempreendedor',
    categoria: 'empresas',
    definicao:
      'Pessoa física com receita de até R$ 40,5 mil/ano (metade do teto do MEI) que fica fora do IVA — não precisa recolher CBS/IBS.',
    relacionados: ['Simples Nacional'],
  },
  {
    termo: 'Produtor rural não contribuinte',
    categoria: 'empresas',
    definicao:
      'Produtor rural (pessoa física ou jurídica) com receita de até R$ 3,6 mi/ano pode optar por ficar fora do IVA: não recolhe CBS/IBS, e quem compra dele recebe um crédito presumido definido em ato anual.',
    relacionados: ['Nanoempreendedor'],
  },
  {
    termo: 'Zona Franca de Manaus',
    categoria: 'empresas',
    definicao:
      'Mantém vantagem competitiva após a reforma: o IPI é zerado no resto do país, mas preservado para produtos que concorrem com os produzidos na ZFM.',
  },
  {
    termo: 'Comitê Gestor do IBS',
    categoria: 'federacao',
    definicao:
      'Entidade pública que reúne estados e municípios para arrecadar o IBS, uniformizar interpretação e distribuir a receita ao destino. Instituído pela LC 227/2026 (origem: PLP 108/2024, sancionado em janeiro de 2026).',
  },
  {
    termo: 'Transição federativa',
    categoria: 'federacao',
    definicao:
      'De 2029 a 2078, a repartição da receita do IBS migra gradualmente da origem para o destino — 50 anos para suavizar perdas de estados e municípios produtores.',
  },
]
