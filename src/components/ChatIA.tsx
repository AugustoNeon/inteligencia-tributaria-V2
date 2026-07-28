import { useEffect, useRef, useState } from 'react'
import { IA_URL } from '../ia/config'
import { conversar, statusIa, IaDesligadaError, LimiteAtingidoError } from '../ia/cliente'
import type { CartaoFerramenta } from '../ia/ferramentas'
import { FORMULARIOS, ORDEM_INICIO, executarFormulario, type IdFormulario, type ValoresForm } from '../ia/formularios'
import type { MensagemApi } from '../ia/tipos'
import { Mensagem, MarcaIa, RespostaEmCurso } from './chat/Mensagem'
import { FormularioIa } from './chat/FormularioIa'

/**
 * Perguntas de partida — só as conceituais. As que terminariam em conta viraram
 * botões de simulação, que abrem o formulário direto: mais rápido para quem
 * pergunta e sem gastar uma ida à API para descobrir o que ele já sabia querer.
 */
const SUGESTOES = ['O que é o split payment?', 'O que muda para mim em 2027?']

/**
 * Assistente flutuante: botão no canto da tela, painel de chat.
 * A conversa vive no estado deste componente (montado no Shell, fora das
 * rotas) — navegar entre páginas não apaga o histórico. Quando a IA chama
 * a ferramenta da calculadora, a página abre preenchida ao lado do chat.
 *
 * Além de responder, a IA oferece o próximo passo: as respostas podem vir
 * com convites que viram botões e abrem um formulário com os campos daquela
 * simulação. Preenchidos, os valores vão direto ao motor do site — e a IA
 * recebe os números prontos para comentar.
 */
export function ChatIA() {
  const [aberto, setAberto] = useState(false)
  const [ligada, setLigada] = useState<boolean | null>(null)
  const [mensagens, setMensagens] = useState<MensagemApi[]>([])
  const [cartoes, setCartoes] = useState<Record<string, CartaoFerramenta>>({})
  const [formulario, setFormulario] = useState<IdFormulario | null>(null)
  /** resposta ainda sendo escrita pelo modelo (fluxo SSE) */
  const [parcial, setParcial] = useState('')
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aberto && ligada === null) void statusIa().then((s) => setLigada(s.ligada))
  }, [aberto, ligada])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens, ocupado, formulario, parcial])

  const guardarCartao = (chave: string, cartao: CartaoFerramenta) =>
    setCartoes((c) => ({ ...c, [chave]: cartao }))

  /** Roda o loop da IA a partir de um histórico já com a fala do visitante. */
  const rodar = async (base: MensagemApi[]) => {
    setOcupado(true)
    setErro(null)
    try {
      const finais = await conversar(base, {
        onEtapa: setMensagens,
        onCartao: guardarCartao,
        onTexto: setParcial,
      })
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
      setParcial('')
      setOcupado(false)
    }
  }

  const enviar = async (pergunta: string) => {
    const limpa = pergunta.trim()
    if (!limpa || ocupado) return
    setTexto('')
    setFormulario(null)
    const base: MensagemApi[] = [...mensagens, { role: 'user', content: limpa }]
    setMensagens(base)
    await rodar(base)
  }

  /**
   * Envio do formulário: o motor do site calcula aqui mesmo (a tela já abre
   * preenchida e o cartão aparece na hora), e o modelo recebe os números
   * prontos — cabe a ele só interpretar.
   */
  const enviarFormulario = async (id: IdFormulario, valores: ValoresForm) => {
    if (ocupado) return
    const envio = executarFormulario(FORMULARIOS[id], valores)
    setFormulario(null)
    if (envio.url) window.location.hash = envio.url.replace(/^#/, '')

    const base: MensagemApi[] = [...mensagens, { role: 'user', content: envio.mensagem }]
    if (envio.cartao) guardarCartao(`msg:${base.length - 1}`, envio.cartao)
    setMensagens(base)
    await rodar(base)
  }

  const ultimaIa = mensagens.reduce((ultima, m, i) => (m.role === 'assistant' ? i : ultima), -1)

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
            <p className="chat-titulo">
              <MarcaIa />
              Assistente da reforma
            </p>
            <span className="chat-selo mono">ia·beta</span>
          </header>

          {ligada === false && (
            <div className="chat-demo" role="status">
              A IA está <strong>em modo demonstração</strong> (desligada para não gerar custo). Todo o resto do site —
              calculadoras, simuladores, guia — segue 100% funcional.
            </div>
          )}

          <div className="chat-msgs" role="log" aria-live="polite">
            {mensagens.length === 0 && ligada !== false && !formulario && (
              <div className="chat-vazio">
                <p>Pergunte sobre a Reforma Tributária — ou escolha uma conta e eu preencho a página pra você.</p>

                <div className="ia-convites">
                  <p className="ia-convites-titulo mono">posso calcular para você</p>
                  {ORDEM_INICIO.map((id) => (
                    <button key={id} className="ia-convite" onClick={() => setFormulario(id)} disabled={ocupado}>
                      <span aria-hidden>▸</span> {FORMULARIOS[id].convite}
                    </button>
                  ))}
                </div>

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
              <Mensagem
                key={i}
                m={m}
                indice={i}
                cartoes={cartoes}
                ultima={i === ultimaIa && !ocupado && !formulario}
                onEscolherFormulario={setFormulario}
                ocupado={ocupado}
              />
            ))}

            {formulario && (
              <FormularioIa
                spec={FORMULARIOS[formulario]}
                ocupado={ocupado}
                onCancelar={() => setFormulario(null)}
                onEnviar={(valores) => void enviarFormulario(formulario, valores)}
              />
            )}

            {parcial && <RespostaEmCurso texto={parcial} />}

            {/* os pontinhos só até a primeira palavra chegar */}
            {ocupado && !parcial && (
              <p className="chat-pensando">
                <span className="chat-pensando-pontos" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                pensando
              </p>
            )}
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

/** O assistente só aparece quando existe um worker configurado ou em dev. */
export function chatDisponivel(): boolean {
  return IA_URL !== '' || import.meta.env.DEV
}
