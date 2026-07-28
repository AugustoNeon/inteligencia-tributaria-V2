import { afterEach, describe, expect, it, vi } from 'vitest'
import { conversar, IaDesligadaError, LimiteAtingidoError } from './cliente'
import type { EventoChat, MensagemApi } from './tipos'

/** Resposta SSE partida exatamente nos pedaços dados (inclusive no meio de um evento). */
function respostaFluxo(pedacos: string[], status = 200): Response {
  const cod = new TextEncoder()
  const corpo = new ReadableStream({
    start(controlador) {
      for (const p of pedacos) controlador.enqueue(cod.encode(p))
      controlador.close()
    },
  })
  return new Response(corpo, { status, headers: { 'content-type': 'text/event-stream' } })
}

const sse = (e: EventoChat) => `data: ${JSON.stringify(e)}\n\n`

const fingirFetch = (resp: Response) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resp))

const PERGUNTA: MensagemApi[] = [{ role: 'user', content: 'o que é o split payment?' }]

afterEach(() => vi.unstubAllGlobals())

describe('leitura do fluxo', () => {
  it('entrega o texto crescendo e remonta a mensagem no fim', async () => {
    fingirFetch(
      respostaFluxo([
        sse({ tipo: 'texto', delta: 'Split ' }),
        sse({ tipo: 'texto', delta: 'payment é' }),
        sse({ tipo: 'fim', content: [{ type: 'text', text: 'Split payment é' }], stop_reason: 'end_turn' }),
      ]),
    )

    const vistos: string[] = []
    const finais = await conversar(PERGUNTA, { onTexto: (t) => vistos.push(t) })

    expect(vistos).toEqual(['Split ', 'Split payment é', ''])
    expect(finais).toHaveLength(2)
    expect(finais[1]).toEqual({ role: 'assistant', content: [{ type: 'text', text: 'Split payment é' }] })
  })

  it('evento partido no meio de um chunk é remontado', async () => {
    const inteiro = sse({ tipo: 'texto', delta: 'olá' }) + sse({ tipo: 'fim', content: [], stop_reason: 'end_turn' })
    const corte = Math.floor(inteiro.length / 3)
    fingirFetch(respostaFluxo([inteiro.slice(0, corte), inteiro.slice(corte, corte * 2), inteiro.slice(corte * 2)]))

    const vistos: string[] = []
    await conversar(PERGUNTA, { onTexto: (t) => vistos.push(t) })
    expect(vistos).toEqual(['olá', ''])
  })

  it('fluxo cortado antes do "fim" falha em vez de seguir com histórico pela metade', async () => {
    fingirFetch(respostaFluxo([sse({ tipo: 'texto', delta: 'começo' })]))
    await expect(conversar(PERGUNTA)).rejects.toThrow('interrompida')
  })

  it('erro no meio do fluxo vira exceção — 429 mantém o tipo de limite', async () => {
    fingirFetch(respostaFluxo([sse({ tipo: 'erro', status: 429 })]))
    await expect(conversar(PERGUNTA)).rejects.toBeInstanceOf(LimiteAtingidoError)

    fingirFetch(respostaFluxo([sse({ tipo: 'erro', status: 500 })]))
    await expect(conversar(PERGUNTA)).rejects.toThrow('falhou no meio')
  })
})

describe('compatibilidade com o worker antigo', () => {
  it('resposta JSON (sem fluxo) ainda é entendida — evita janela quebrada no deploy', async () => {
    fingirFetch(
      new Response(JSON.stringify({ content: [{ type: 'text', text: 'resposta' }], stop_reason: 'end_turn' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    const finais = await conversar(PERGUNTA)
    expect(finais[1]).toEqual({ role: 'assistant', content: [{ type: 'text', text: 'resposta' }] })
  })
})

describe('estados do worker antes do fluxo', () => {
  it('503 é IA desligada; 429 é limite', async () => {
    fingirFetch(new Response('{}', { status: 503 }))
    await expect(conversar(PERGUNTA)).rejects.toBeInstanceOf(IaDesligadaError)

    fingirFetch(new Response('{}', { status: 429 }))
    await expect(conversar(PERGUNTA)).rejects.toBeInstanceOf(LimiteAtingidoError)
  })
})

describe('loop de ferramentas', () => {
  it('executa a ferramenta, navega e devolve o cartão ao chamador', async () => {
    const chamada = vi
      .fn()
      .mockResolvedValueOnce(
        respostaFluxo([
          sse({
            tipo: 'fim',
            content: [
              {
                type: 'tool_use',
                id: 'tu1',
                name: 'abrir_calculadora',
                input: { preco: 300, categoria: 'produto-padrao', ano: 2033 },
              },
            ],
            stop_reason: 'tool_use',
          }),
        ]),
      )
      .mockResolvedValueOnce(
        respostaFluxo([sse({ tipo: 'fim', content: [{ type: 'text', text: 'pronto' }], stop_reason: 'end_turn' })]),
      )
    vi.stubGlobal('fetch', chamada)
    // o teste roda em node: só o pedaço de window que o loop toca
    const local = { hash: '' }
    vi.stubGlobal('window', { location: local })

    const cartoes: string[] = []
    const finais = await conversar(PERGUNTA, { onCartao: (id) => cartoes.push(id) })

    expect(cartoes).toEqual(['tu1'])
    expect(local.hash).toContain('/calculadora?preco=300')
    // pergunta, tool_use, tool_result, resposta final
    expect(finais).toHaveLength(4)
    expect(finais[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'tu1' })
  })
})
