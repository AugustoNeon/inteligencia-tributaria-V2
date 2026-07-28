/** Tipos do fio cliente ↔ worker ↔ API da Claude (subset mínimo, sem SDK no front). */

export interface BlocoTexto {
  type: 'text'
  text: string
}

export interface BlocoFerramenta {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface BlocoResultadoFerramenta {
  type: 'tool_result'
  tool_use_id: string
  content: string
}

export type BlocoAssistente = BlocoTexto | BlocoFerramenta

export interface MensagemApi {
  role: 'user' | 'assistant'
  content: string | (BlocoTexto | BlocoFerramenta | BlocoResultadoFerramenta)[]
}

/** Resposta do endpoint /chat do worker, já remontada a partir do fluxo. */
export interface RespostaChat {
  content: BlocoAssistente[]
  stop_reason: string
}

/**
 * Eventos do fluxo SSE de /chat. O worker não repassa os eventos crus da API:
 * manda só o pedaço de texto (para a tela acompanhar a escrita) e, no fim, a
 * mensagem inteira remontada — que é o que entra no histórico e alimenta as
 * ferramentas.
 */
export type EventoChat =
  | { tipo: 'texto'; delta: string }
  | { tipo: 'fim'; content: BlocoAssistente[]; stop_reason: string }
  | { tipo: 'erro'; status: number | null }

/** Resposta do endpoint /status do worker. */
export interface StatusIa {
  ligada: boolean
  expira: string | null
}
