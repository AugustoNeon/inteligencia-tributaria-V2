/** Fontes oficiais — anexadas ao Guia e à página de referências. */

export interface Fonte {
  id: string
  titulo: string
  orgao: string
  tipo: 'Emenda' | 'Lei' | 'Projeto' | 'Portal'
  url: string
  descricao: string
}

export const FONTES: Fonte[] = [
  {
    id: 'ec-132',
    titulo: 'Emenda Constitucional nº 132/2023',
    orgao: 'Planalto',
    tipo: 'Emenda',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
    descricao: 'O texto que altera a Constituição: cria IBS (art. 156-A), CBS (art. 195, V) e Imposto Seletivo (art. 153, VIII), define a transição e o cashback.',
  },
  {
    id: 'lc-214',
    titulo: 'Lei Complementar nº 214/2025',
    orgao: 'Planalto',
    tipo: 'Lei',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    descricao: 'A regulamentação geral: fato gerador, alíquotas, regimes diferenciados e específicos, Cesta Básica Nacional (Anexo I), split payment e cashback.',
  },
  {
    id: 'plp-108',
    titulo: 'PLP 108/2024 — Comitê Gestor do IBS',
    orgao: 'Câmara dos Deputados',
    tipo: 'Projeto',
    url: 'https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2374064',
    descricao: 'Disciplina o Comitê Gestor do IBS, o contencioso administrativo e mudanças no ITCMD. Acompanhe a tramitação na ficha oficial.',
  },
  {
    id: 'portal-fazenda',
    titulo: 'Portal da Reforma Tributária',
    orgao: 'Ministério da Fazenda',
    tipo: 'Portal',
    url: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
    descricao: 'Página oficial do governo com notas técnicas (inclusive da alíquota de referência), perguntas e respostas e materiais de divulgação.',
  },
  {
    id: 'constituicao',
    titulo: 'Constituição Federal (texto compilado)',
    orgao: 'Planalto',
    tipo: 'Lei',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
    descricao: 'Texto constitucional já com as alterações da EC 132/2023 — consulte os arts. 153, 156-A, 156-B e 195.',
  },
  {
    id: 'senado-tema',
    titulo: 'Reforma Tributária — Agência Senado',
    orgao: 'Senado Federal',
    tipo: 'Portal',
    url: 'https://www12.senado.leg.br/noticias/ultimas/reforma-tributaria',
    descricao: 'Cobertura legislativa contínua da reforma no Senado, com histórico de votações.',
  },
  {
    id: 'lc-123',
    titulo: 'LC 123/2006 — Simples Nacional',
    orgao: 'Planalto',
    tipo: 'Lei',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
    descricao: 'O Simples continua existindo após a reforma; a LC 214 permite ao optante recolher CBS/IBS "por fora" para transferir créditos.',
  },
]

export const fonte = (id: string): Fonte => {
  const f = FONTES.find((x) => x.id === id)
  if (!f) throw new Error(`Fonte desconhecida: ${id}`)
  return f
}
