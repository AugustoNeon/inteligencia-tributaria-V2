/**
 * Cliente do chat: fala com o worker e roda o loop agêntico no navegador.
 * O worker é um relé burro (guarda a chave, aplica limites); quem executa
 * as ferramentas — e navega a tela — é este lado.
 */

import { IA_URL } from './config'
import { executarFerramenta, type CartaoFerramenta } from './ferramentas'
import type { BlocoResultadoFerramenta, EventoChat, MensagemApi, RespostaChat, StatusIa } from './tipos'

export class IaDesligadaError extends Error {}
export class LimiteAtingidoError extends Error {}

const MAX_RODADAS = 4

export interface EscutaConversa {
  /** a cada passo do loop (texto parcial, ferramenta executada) */
  onEtapa?: (mensagens: MensagemApi[]) => void
  /** cartão de uma simulação, chaveado pelo id do bloco tool_use que a pediu */
  onCartao?: (idBloco: string, cartao: CartaoFerramenta) => void
  /** texto acumulado da resposta em curso — string vazia quando ela se fecha */
  onTexto?: (acumulado: string) => void
}

/**
 * Lê o fluxo SSE de /chat, entregando o texto conforme ele chega e devolvendo
 * a mensagem remontada no fim. Sem `fim`, a resposta veio truncada — melhor
 * falhar do que seguir o loop de ferramentas com um histórico pela metade.
 */
async function lerFluxo(resp: Response, onTexto?: (t: string) => void): Promise<RespostaChat> {
  const leitor = resp.body?.getReader()
  if (!leitor) throw new Error('O assistente não respondeu. Tente de novo em instantes.')

  const decodificador = new TextDecoder()
  let sobra = ''
  let texto = ''
  let final: RespostaChat | null = null

  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    sobra += decodificador.decode(value, { stream: true })

    const blocos = sobra.split('\n\n')
    sobra = blocos.pop() ?? ''
    for (const bloco of blocos) {
      const linha = bloco.trim()
      if (!linha.startsWith('data:')) continue
      const evento = JSON.parse(linha.slice(5)) as EventoChat
      if (evento.tipo === 'texto') {
        texto += evento.delta
        onTexto?.(texto)
      } else if (evento.tipo === 'fim') {
        final = { content: evento.content, stop_reason: evento.stop_reason }
      } else {
        if (evento.status === 429) throw new LimiteAtingidoError()
        throw new Error('O assistente falhou no meio da resposta. Tente de novo em instantes.')
      }
    }
  }

  if (!final) throw new Error('A resposta foi interrompida antes do fim. Tente de novo.')
  return final
}

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
 * A `escuta` deixa a interface acompanhar cada passo e guardar os cartões
 * das simulações que forem rodando.
 */
export async function conversar(historico: MensagemApi[], escuta: EscutaConversa = {}): Promise<MensagemApi[]> {
  const { onEtapa, onCartao, onTexto } = escuta
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

    // worker antigo (ainda sem fluxo) responde JSON — aceitar os dois formatos
    // faz o site novo funcionar antes de o worker ser reimplantado
    const emFluxo = resp.headers.get('content-type')?.includes('text/event-stream')
    const dados = emFluxo ? await lerFluxo(resp, onTexto) : ((await resp.json()) as RespostaChat)
    // o texto em curso vira mensagem fechada: limpa o parcial no mesmo lote
    onTexto?.('')
    mensagens.push({ role: 'assistant', content: dados.content })
    onEtapa?.([...mensagens])

    if (dados.stop_reason !== 'tool_use') break

    const resultados: BlocoResultadoFerramenta[] = dados.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        const r = executarFerramenta(b.name, b.input)
        if (r.url) window.location.hash = r.url.replace(/^#/, '')
        if (r.cartao) onCartao?.(b.id, r.cartao)
        return { type: 'tool_result', tool_use_id: b.id, content: r.texto }
      })
    mensagens.push({ role: 'user', content: resultados })
    onEtapa?.([...mensagens])
  }

  return mensagens
}
