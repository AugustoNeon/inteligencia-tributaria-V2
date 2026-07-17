/**
 * Radar da reforma — marcos verificados, do mais recente ao mais antigo,
 * mais o próximo da fila. Cada item aponta p/ uma fonte de data/fontes.ts.
 */

export interface Novidade {
  /** data curta exibida no eixo (dd/mm/aaaa ou mês/ano) */
  data: string
  titulo: string
  texto: string
  /** id em data/fontes.ts */
  fonteId?: string
  /** marco previsto, ainda não ocorrido */
  futuro?: boolean
}

/** exibido na interface — atualize ao revisar os marcos */
export const RADAR_VERIFICADO_EM = 'julho de 2026'

export const NOVIDADES: Novidade[] = [
  {
    data: '2027',
    titulo: 'A virada federal',
    texto:
      'Próximo grande marco: PIS e Cofins são extintos, a CBS entra com alíquota cheia, o Imposto Seletivo passa a valer e começa o cashback da CBS.',
    fonteId: 'lc-214',
    futuro: true,
  },
  {
    data: 'jan/2026',
    titulo: 'Começa o ano-teste',
    texto:
      'CBS de 0,9% e IBS de 0,1% passam a ser destacados nas notas fiscais. Quem cumpre as obrigações acessórias fica dispensado de recolher — o objetivo é calibrar sistemas, não arrecadar.',
    fonteId: 'portal-fazenda',
  },
  {
    data: '13/01/2026',
    titulo: 'Comitê Gestor do IBS vira lei',
    texto:
      'O PLP 108/2024 é sancionado como LC 227/2026: institui o Comitê Gestor do IBS e o contencioso administrativo do imposto. A regulamentação principal da reforma está completa.',
    fonteId: 'lc-227',
  },
  {
    data: '16/01/2025',
    titulo: 'LC 214 sancionada',
    texto:
      'A lei geral do IVA dual: fato gerador, alíquotas, regimes diferenciados e específicos, Cesta Básica Nacional, split payment e cashback.',
    fonteId: 'lc-214',
  },
  {
    data: '20/12/2023',
    titulo: 'EC 132 promulgada',
    texto:
      'Depois de mais de 30 anos de tentativas, a Constituição ganha o IBS, a CBS e o Imposto Seletivo — e o cronograma de transição 2026–2033.',
    fonteId: 'ec-132',
  },
]
