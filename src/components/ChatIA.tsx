import { useEffect, useRef, useState } from 'react'
import { IA_URL } from '../ia/config'
import { conversar, statusIa, IaDesligadaError, LimiteAtingidoError } from '../ia/cliente'
import type { MensagemApi } from '../ia/tipos'

const SUGESTOES = [
  'O que é o split payment?',
  'Quanto custará um tênis de R$ 300 em 2030?',
  'Minha família tem direito ao cashback?',
]

/**
 * Assistente flutuante: botão no canto da tela, painel de chat.
 * A conversa vive no estado deste componente (montado no Shell, fora das
 * rotas) — navegar entre páginas não apaga o histórico. Quando a IA chama
 * a ferramenta da calculadora, a página abre preenchida ao lado do chat.
 */
export function ChatIA() {
  const [aberto, setAberto] = useState(false)
  const [ligada, setLigada] = useState<boolean | null>(null)
  const [mensagens, setMensagens] = useState<MensagemApi[]>([])
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aberto && ligada === null) void statusIa().then((s) => setLigada(s.ligada))
  }, [aberto, ligada])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens, ocupado])

  const enviar = async (pergunta: string) => {
    const limpa = pergunta.trim()
    if (!limpa || ocupado) return
    setErro(null)
    setTexto('')
    const base: MensagemApi[] = [...mensagens, { role: 'user', content: limpa }]
    setMensagens(base)
    setOcupado(true)
    try {
      const finais = await conversar(base, setMensagens)
      setMensagens(finais)
    } catch (e) {
      if (e instanceof IaDesligadaError) {
        setLigada(false)
      } else if (e instanceof LimiteAtingidoError) {
        setErro('Muitas perguntas em pouco tempo — aguarde alguns minutos e tente de novo.')
      } else {
        setErro(e instanceof Error ? e.message : 'Algo deu errado. Tente novamente.')
      }
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <button
        className="chat-fab"
        aria-label={aberto ? 'Fechar o assistente de IA' : 'Abrir o assistente de IA'}
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
      >
        {aberto ? (
          <svg viewBox="0 0 24 24" aria-hidden width="22" height="22">
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden width="22" height="22">
            <path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4c-.6.5-1.3 0-1.3-.7V6.5Z"
              fill="currentColor"
            />
            <circle cx="9" cy="10" r="1.15" fill="var(--petrol, #12333d)" />
            <circle cx="13" cy="10" r="1.15" fill="var(--petrol, #12333d)" />
            <circle cx="17" cy="10" r="1.15" fill="var(--petrol, #12333d)" />
          </svg>
        )}
      </button>

      {aberto && (
        <section className="chat-painel" aria-label="Assistente de IA sobre a Reforma Tributária">
          <header className="chat-cab">
            <p className="chat-titulo">Assistente da reforma</p>
            <span className="chat-selo mono">ia·beta</span>
          </header>

          {ligada === false && (
            <div className="chat-demo" role="status">
              A IA está <strong>em modo demonstração</strong> (desligada para não gerar custo). Todo o resto do site —
              calculadoras, simuladores, guia — segue 100% funcional.
            </div>
          )}

          <div className="chat-msgs" role="log" aria-live="polite">
            {mensagens.length === 0 && ligada !== false && (
              <div className="chat-vazio">
                <p>Pergunte sobre a Reforma Tributária — e quando fizer sentido, eu abro a calculadora pra você.</p>
                <div className="chat-sugestoes">
                  {SUGESTOES.map((s) => (
                    <button key={s} className="chip" onClick={() => void enviar(s)} disabled={ocupado}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) => (
              <Mensagem key={i} m={m} />
            ))}

            {ocupado && <p className="chat-pensando">pensando…</p>}
            {erro && <p className="chat-erro">{erro}</p>}
            <div ref={fimRef} />
          </div>

          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              void enviar(texto)
            }}
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={ligada === false ? 'IA desligada no momento' : 'Sua pergunta sobre a reforma…'}
              aria-label="Pergunta para o assistente"
              disabled={ocupado || ligada === false}
              maxLength={500}
            />
            <button type="submit" className="botao-acao" disabled={ocupado || ligada === false || !texto.trim()}>
              Enviar
            </button>
          </form>

          <p className="chat-disclaimer">
            Respostas geradas por IA a partir do conteúdo do site — estimativas didáticas, podem conter erros e não
            substituem orientação contábil ou jurídica.
          </p>
        </section>
      )}
    </>
  )
}

function Mensagem({ m }: { m: MensagemApi }) {
  if (m.role === 'user') {
    // tool_results são internos do protocolo — não renderizar como fala do usuário
    if (typeof m.content !== 'string') return null
    return <p className="chat-msg chat-msg-user">{m.content}</p>
  }
  const blocos = typeof m.content === 'string' ? [{ type: 'text' as const, text: m.content }] : m.content
  return (
    <>
      {blocos.map((b, i) => {
        if (b.type === 'text' && b.text.trim()) {
          return (
            <p key={i} className="chat-msg chat-msg-ia">
              {b.text}
            </p>
          )
        }
        if (b.type === 'tool_use') {
          return (
            <p key={i} className="chat-tool mono">
              → abrindo a calculadora…
            </p>
          )
        }
        return null
      })}
    </>
  )
}

/** O assistente só aparece quando existe um worker configurado ou em dev. */
export function chatDisponivel(): boolean {
  return IA_URL !== '' || import.meta.env.DEV
}
