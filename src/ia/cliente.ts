/**
 * Cliente do chat: fala com o worker e roda o loop agêntico no navegador.
 * O worker é um relé burro (guarda a chave, aplica limites); quem executa
 * as ferramentas — e navega a tela — é este lado.
 */

import { IA_URL } from './config'
import { executarFerramenta } from './ferramentas'
import type { BlocoResultadoFerramenta, MensagemApi, RespostaChat, StatusIa } from './tipos'

export class IaDesligadaError extends Error {}
export class LimiteAtingidoError extends Error {}

const MAX_RODADAS = 4

export async function statusIa(): Promise<StatusIa> {
  if (!IA_URL) return { ligada: false, expira: null }
  try {
    const resp = await fetch(`${IA_URL}/status`)
    if (!resp.ok) return { ligada: false, expira: null }
    return (await resp.json()) as StatusIa
  } catch {
    return { ligada: false, expira: null }
  }
}

/**
 * Envia o histórico e conduz o loop de ferramentas até a resposta final.
 * `onEtapa` é chamado a cada passo (texto parcial, ferramenta executada)
 * para a interface acompanhar.
 */
export async function conversar(
  historico: MensagemApi[],
  onEtapa?: (mensagens: MensagemApi[]) => void,
): Promise<MensagemApi[]> {
  if (!IA_URL) throw new IaDesligadaError()
  const mensagens = [...historico]

  for (let rodada = 0; rodada < MAX_RODADAS; rodada++) {
    const resp = await fetch(`${IA_URL}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: mensagens }),
    })
    if (resp.status === 503) throw new IaDesligadaError()
    if (resp.status === 429) throw new LimiteAtingidoError()
    if (!resp.ok) throw new Error(`O assistente falhou (HTTP ${resp.status}). Tente de novo em instantes.`)

    const dados = (await resp.json()) as RespostaChat
    mensagens.push({ role: 'assistant', content: dados.content })
    onEtapa?.([...mensagens])

    if (dados.stop_reason !== 'tool_use') break

    const resultados: BlocoResultadoFerramenta[] = dados.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        const r = executarFerramenta(b.name, b.input)
        if (r.url) window.location.hash = r.url.replace(/^#/, '')
        return { type: 'tool_result', tool_use_id: b.id, content: r.texto }
      })
    mensagens.push({ role: 'user', content: resultados })
    onEtapa?.([...mensagens])
  }

  return mensagens
}
