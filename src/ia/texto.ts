/**
 * Leitor do texto rico que a IA escreve.
 *
 * O briefing libera um markdown mínimo — parágrafos, **negrito** e listas
 * com "- " — porque o modelo escreve melhor quando pode hierarquizar. Aqui
 * esse subconjunto vira estrutura; a renderização é do componente.
 *
 * Nada de biblioteca de markdown: o vocabulário é pequeno, fechado e a
 * saída nunca vira HTML (só nós de React), então não há superfície de
 * injeção. Valores em R$ e % são reconhecidos à parte para vestirem a
 * fonte de dados do projeto (DESIGN.md: mono para número).
 */

export interface Trecho {
  valor: string
  /** veio de **asteriscos** */
  forte?: boolean
  /** valor monetário ou percentual — veste --font-mono */
  dado?: boolean
}

export type Bloco = { tipo: 'paragrafo'; trechos: Trecho[] } | { tipo: 'lista'; itens: Trecho[][] }

/** R$ 1.234,56 · 26,5% · −R$ 2,60 — com sinal opcional colado */
const RE_DADO = /[−-]?R\$\s?\d[\d.]*(?:,\d+)?|[−-]?\d+(?:,\d+)?\s?%/g
const RE_ITEM = /^\s*[-•*]\s+(.*)$/

/**
 * Negrito ainda aberto — o texto chega em fluxo e a marca de fechamento pode
 * não ter vindo. Fecha no fim da linha para o trecho já nascer forte (em vez
 * de piscar cru e depois virar negrito); se nem um caractere veio depois da
 * marca, descarta a marca.
 */
function normalizarNegrito(linha: string): string {
  const marcas = linha.match(/\*\*/g)?.length ?? 0
  if (marcas % 2 === 0) return linha
  return linha.endsWith('**') ? linha.slice(0, -2) : `${linha}**`
}

/** Quebra uma linha em trechos, marcando negrito e valores. */
export function analisarLinha(linha: string): Trecho[] {
  const trechos: Trecho[] = []
  // **negrito** primeiro: os pedaços ímpares do split são o conteúdo forte
  const partes = normalizarNegrito(linha).split(/\*\*(.+?)\*\*/g)
  partes.forEach((parte, i) => {
    if (!parte) return
    const forte = i % 2 === 1
    for (const t of separarDados(parte)) trechos.push(forte ? { ...t, forte: true } : t)
  })
  return trechos
}

function separarDados(texto: string): Trecho[] {
  const trechos: Trecho[] = []
  let cursor = 0
  for (const achado of texto.matchAll(RE_DADO)) {
    const inicio = achado.index ?? 0
    if (inicio > cursor) trechos.push({ valor: texto.slice(cursor, inicio) })
    trechos.push({ valor: achado[0], dado: true })
    cursor = inicio + achado[0].length
  }
  if (cursor < texto.length) trechos.push({ valor: texto.slice(cursor) })
  return trechos
}

/**
 * Um trecho por palavra, para a resposta em fluxo poder revelar palavra a
 * palavra. O espaço fica colado no fim da palavra anterior (não vira unidade
 * própria) para nenhuma unidade nascer invisível e o texto não "respirar"
 * entre palavras. Valores em R$/% ficam inteiros: uma quantia não deveria
 * aparecer partida ao meio.
 */
export function separarPalavras(trechos: Trecho[]): Trecho[] {
  const palavras: Trecho[] = []
  for (const trecho of trechos) {
    if (trecho.dado) {
      palavras.push(trecho)
      continue
    }
    for (const pedaco of trecho.valor.split(/(?<=\s)/)) {
      if (pedaco) palavras.push({ ...trecho, valor: pedaco })
    }
  }
  return palavras
}

/**
 * Texto cru da IA → blocos. Linhas seguidas viram um parágrafo só (o modelo
 * quebra linha por hábito, não por intenção); linha em branco separa de fato.
 */
export function analisarTexto(bruto: string): Bloco[] {
  const blocos: Bloco[] = []
  let paragrafo: string[] = []
  let lista: string[] = []

  const fecharParagrafo = () => {
    if (paragrafo.length) blocos.push({ tipo: 'paragrafo', trechos: analisarLinha(paragrafo.join(' ')) })
    paragrafo = []
  }
  const fecharLista = () => {
    if (lista.length) blocos.push({ tipo: 'lista', itens: lista.map(analisarLinha) })
    lista = []
  }

  for (const linha of bruto.split('\n')) {
    const item = RE_ITEM.exec(linha)
    if (item) {
      fecharParagrafo()
      lista.push(item[1].trim())
    } else if (!linha.trim()) {
      fecharParagrafo()
      fecharLista()
    } else {
      fecharLista()
      paragrafo.push(linha.trim())
    }
  }
  fecharParagrafo()
  fecharLista()
  return blocos
}
