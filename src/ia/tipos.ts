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

/** Resposta do endpoint /chat do worker. */
export interface RespostaChat {
  content: BlocoAssistente[]
  stop_reason: string
}

/** Resposta do endpoint /status do worker. */
export interface StatusIa {
  ligada: boolean
  expira: string | null
}
