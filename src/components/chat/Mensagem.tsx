/**
 * As peças que compõem o transcrito do chat.
 *
 * A fala do visitante é uma bolha; a da IA não. Ela ocupa a largura toda,
 * com a marca à esquerda e um filete separando as respostas — leitura de
 * documento, não de mensageiro. Valores vestem a fonte mono do projeto.
 */

import type { CartaoFerramenta } from '../../ia/ferramentas'
import type { Convite } from '../../ia/convites'
import { extrairConvites } from '../../ia/convites'
import { analisarTexto, separarPalavras, type Trecho } from '../../ia/texto'
import type { BlocoTexto, BlocoFerramenta, BlocoResultadoFerramenta, MensagemApi } from '../../ia/tipos'
import { falaVisivel } from '../../ia/formularios'
import type { IdFormulario } from '../../ia/formularios'

/** Losango da marca — o mesmo sinal do botão flutuante, em miniatura. */
export function MarcaIa() {
  return (
    <svg className="ia-marca" viewBox="0 0 16 16" aria-hidden width="14" height="14">
      <path d="M8 1 15 8 8 15 1 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 5 11 8 8 11 5 8Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Enquanto a resposta chega, cada palavra é uma unidade própria que surge
 * esmaecida e ganha opacidade. A chave é a posição: palavra já escrita mantém
 * o índice, React reaproveita o nó e a animação não recomeça — só a recém
 * chegada aparece. Fechada a mensagem, o texto volta a ser um nó só.
 */
function Trechos({ trechos, fluindo }: { trechos: Trecho[]; fluindo?: boolean }) {
  const unidades = fluindo ? separarPalavras(trechos) : trechos
  return (
    <>
      {unidades.map((t, i) => {
        const conteudo = t.dado ? <span className="ia-dado">{t.valor}</span> : t.valor
        return (
          <span key={i} className={fluindo ? 'ia-palavra' : undefined}>
            {t.forte ? <strong>{conteudo}</strong> : conteudo}
          </span>
        )
      })}
    </>
  )
}

/** Texto rico da IA: parágrafos, listas curtas, negrito e valores em mono. */
export function TextoIa({ texto, fluindo }: { texto: string; fluindo?: boolean }) {
  return (
    <>
      {analisarTexto(texto).map((bloco, i) =>
        bloco.tipo === 'lista' ? (
          <ul key={i} className="ia-lista">
            {bloco.itens.map((item, j) => (
              <li key={j}>
                <Trechos trechos={item} fluindo={fluindo} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="ia-paragrafo">
            <Trechos trechos={bloco.trechos} fluindo={fluindo} />
          </p>
        ),
      )}
    </>
  )
}

/** Resultado de uma simulação, preso ao histórico da conversa. */
export function CartaoIa({ cartao }: { cartao: CartaoFerramenta }) {
  return (
    <div className={`ia-cartao ia-cartao-${cartao.destaque.tom}`}>
      <p className="ia-cartao-cab mono">
        <span className="ia-cartao-nome">{cartao.ferramenta}</span>
        <span className="ia-cartao-ctx">{cartao.contexto}</span>
      </p>
      <dl className="ia-cartao-linhas">
        {cartao.linhas.map((l) => (
          <div key={l.rotulo}>
            <dt>{l.rotulo}</dt>
            <dd className="mono">{l.valor}</dd>
            <dd className="ia-cartao-nota mono">{l.nota ?? ''}</dd>
          </div>
        ))}
      </dl>
      <p className="ia-cartao-destaque">
        <span>{cartao.destaque.rotulo}</span>
        <strong className="mono">{cartao.destaque.valor}</strong>
      </p>
      <button className="ia-cartao-link" onClick={() => (window.location.hash = cartao.url.replace(/^#/, ''))}>
        Ver na tela ↗
      </button>
    </div>
  )
}

/** Os oferecimentos que a IA deixou no fim da resposta, já como botões. */
export function ConvitesIa({
  convites,
  onEscolher,
  desabilitado,
}: {
  convites: Convite[]
  onEscolher: (id: IdFormulario) => void
  desabilitado: boolean
}) {
  return (
    <div className="ia-convites">
      <p className="ia-convites-titulo mono">posso fazer por você</p>
      {convites.map((c) => (
        <button key={c.formulario} className="ia-convite" onClick={() => onEscolher(c.formulario)} disabled={desabilitado}>
          <span aria-hidden>▸</span> {c.rotulo}
        </button>
      ))}
    </div>
  )
}

/**
 * A resposta enquanto o modelo ainda a escreve. Mesma tipografia da mensagem
 * fechada — o texto não deve pular de lugar quando o fluxo termina —, com um
 * cursor no fim para deixar claro que ainda está vindo. Convites só aparecem
 * depois: enquanto flui, as linhas ::acao são apenas removidas.
 */
export function RespostaEmCurso({ texto }: { texto: string }) {
  const visivel = extrairConvites(texto).texto
  return (
    <div className="chat-msg-ia chat-msg-ia-fluindo" aria-busy="true">
      <span className="chat-msg-ia-marca" aria-hidden>
        <MarcaIa />
      </span>
      <div className="chat-msg-ia-corpo">
        {visivel ? <TextoIa texto={visivel} fluindo /> : <p className="ia-paragrafo" />}
      </div>
    </div>
  )
}

const ROTULOS_FERRAMENTA: Record<string, string> = {
  abrir_calculadora: 'rodando a calculadora',
  abrir_cesta: 'montando a cesta mensal',
  abrir_cashback: 'simulando o cashback',
  abrir_raio_x: 'preparando o raio-X',
}

type BlocoQualquer = BlocoTexto | BlocoFerramenta | BlocoResultadoFerramenta

export function Mensagem({
  m,
  indice,
  cartoes,
  ultima,
  onEscolherFormulario,
  ocupado,
}: {
  m: MensagemApi
  indice: number
  /** id do bloco tool_use (ou "msg:<i>", para envio de formulário) → cartão */
  cartoes: Record<string, CartaoFerramenta>
  /** só a última fala da IA mostra convites — os antigos ficariam obsoletos */
  ultima: boolean
  onEscolherFormulario: (id: IdFormulario) => void
  ocupado: boolean
}) {
  if (m.role === 'user') {
    // tool_results são internos do protocolo — não renderizar como fala do usuário
    if (typeof m.content !== 'string') return null
    const cartao = cartoes[`msg:${indice}`]
    return (
      <>
        <p className="chat-msg chat-msg-user">{falaVisivel(m.content)}</p>
        {cartao && <CartaoIa cartao={cartao} />}
      </>
    )
  }

  const blocos: BlocoQualquer[] = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : m.content
  return (
    <div className="chat-msg-ia">
      <span className="chat-msg-ia-marca" aria-hidden>
        <MarcaIa />
      </span>
      <div className="chat-msg-ia-corpo">
        {blocos.map((b, i) => {
          if (b.type === 'text') {
            const { texto, convites } = extrairConvites(b.text)
            if (!texto && !convites.length) return null
            return (
              <div key={i}>
                {texto && <TextoIa texto={texto} />}
                {ultima && convites.length > 0 && (
                  <ConvitesIa convites={convites} onEscolher={onEscolherFormulario} desabilitado={ocupado} />
                )}
              </div>
            )
          }
          if (b.type === 'tool_use') {
            const cartao = cartoes[b.id]
            if (cartao) return <CartaoIa key={i} cartao={cartao} />
            return (
              <p key={i} className="chat-tool mono">
                <span className="chat-tool-barra" aria-hidden />
                {ROTULOS_FERRAMENTA[b.name] ?? 'consultando o site'}…
              </p>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}
