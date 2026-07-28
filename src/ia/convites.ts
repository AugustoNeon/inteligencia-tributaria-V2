/**
 * Convites de ação — como a IA oferece fazer algo pelo visitante.
 *
 * O modelo termina certas respostas com linhas no formato
 *   ::acao cesta | Incluir minhas despesas e ver a diferença no meu mês
 * e este módulo as arranca do texto antes de exibir, transformando-as em
 * botões. Sintaxe em linha (em vez de uma ferramenta dedicada) porque um
 * convite não precisa de ida e volta à API: ele já cabe na resposta que o
 * modelo estava escrevendo de qualquer jeito.
 *
 * Ids desconhecidos são descartados em silêncio — se o modelo inventar um
 * nome de tela, o visitante vê a resposta sem o botão, nunca um botão morto.
 */

import { ehIdFormulario, type IdFormulario } from './formularios'

export interface Convite {
  formulario: IdFormulario
  rotulo: string
}

/** some do texto: qualquer linha de convite, mesmo ainda sendo escrita */
const RE_LINHA = /^\s*::acao\b/
/** vira botão: só a linha completa, com id e rótulo */
const RE_CONVITE = /^\s*::acao\s+([a-z-]+)\s*\|\s*(.+?)\s*$/
const MAX_CONVITES = 2

/**
 * Separa o texto para exibição dos convites que ele carregava no fim.
 *
 * Reconhecer a linha e reconhecer o convite são coisas diferentes de
 * propósito: enquanto a resposta chega em fluxo, "::acao ces" ainda não é um
 * convite mas já não pode aparecer na tela como texto.
 */
export function extrairConvites(bruto: string): { texto: string; convites: Convite[] } {
  const linhas: string[] = []
  const convites: Convite[] = []

  for (const linha of bruto.split('\n')) {
    if (!RE_LINHA.test(linha)) {
      linhas.push(linha)
      continue
    }
    const achado = RE_CONVITE.exec(linha)
    if (!achado) continue
    const [, id, rotulo] = achado
    if (ehIdFormulario(id) && !convites.some((c) => c.formulario === id)) {
      convites.push({ formulario: id, rotulo })
    }
  }

  return { texto: linhas.join('\n').trim(), convites: convites.slice(0, MAX_CONVITES) }
}
