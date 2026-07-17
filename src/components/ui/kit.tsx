import { useState, type ReactNode } from 'react'
import type { Fonte } from '../../data/fontes'

/** Tile de estatística — label, valor, contexto. */
export function StatTile({ label, valor, contexto, tom }: { label: string; valor: string; contexto?: string; tom?: 'novo' | 'antigo' }) {
  return (
    <div className={`stat-tile${tom ? ` stat-${tom}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{valor}</span>
      {contexto && <span className="stat-ctx">{contexto}</span>}
    </div>
  )
}

/** Aviso/premissa — usado para "como calculamos" e disclaimers. */
export function Callout({ titulo, children, tom = 'info' }: { titulo?: string; children: ReactNode; tom?: 'info' | 'atencao' }) {
  return (
    <aside className={`callout callout-${tom}`}>
      {titulo && <strong className="callout-title">{titulo}</strong>}
      <div className="callout-body">{children}</div>
    </aside>
  )
}

/** Link para fonte oficial — sempre com órgão e URL visível ao hover. */
export function SourceLink({ fonte }: { fonte: Fonte }) {
  return (
    <a className="source-link" href={fonte.url} target="_blank" rel="noopener noreferrer" title={fonte.url}>
      <span className="source-tipo">{fonte.tipo}</span>
      <span className="source-titulo">{fonte.titulo}</span>
      <span className="source-orgao">{fonte.orgao} ↗</span>
    </a>
  )
}

/** Grupo rotulado de campo de formulário. */
export function Campo({ label, sufixo, children, dica }: { label: string; sufixo?: string; children: ReactNode; dica?: string }) {
  return (
    <label className="campo">
      <span className="campo-label">
        {label}
        {sufixo && <span className="campo-sufixo">{sufixo}</span>}
      </span>
      {children}
      {dica && <span className="campo-dica">{dica}</span>}
    </label>
  )
}

/** Entrada numérica em R$ ou %. */
export function EntradaNumero({
  valor,
  onMudar,
  min = 0,
  max,
  passo = 1,
  prefixo,
}: {
  valor: number
  onMudar: (v: number) => void
  min?: number
  max?: number
  passo?: number
  prefixo?: string
}) {
  return (
    <span className="entrada-num">
      {prefixo && <span className="entrada-prefixo">{prefixo}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(valor) ? valor : ''}
        min={min}
        max={max}
        step={passo}
        onChange={(e) => onMudar(e.target.valueAsNumber || 0)}
      />
    </span>
  )
}

/** Controle segmentado (abas pequenas). */
export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  onMudar,
  ariaLabel,
}: {
  opcoes: { valor: T; rotulo: string }[]
  valor: T
  onMudar: (v: T) => void
  ariaLabel: string
}) {
  return (
    <div className="segmentado" role="tablist" aria-label={ariaLabel}>
      {opcoes.map((o) => (
        <button
          key={String(o.valor)}
          role="tab"
          aria-selected={valor === o.valor}
          className={valor === o.valor ? 'on' : ''}
          onClick={() => onMudar(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

/** Sanfona para conteúdo expansível ("como calculamos", FAQ). */
export function Sanfona({ titulo, children, abertoInicial = false }: { titulo: string; children: ReactNode; abertoInicial?: boolean }) {
  const [aberto, setAberto] = useState(abertoInicial)
  return (
    <div className={`sanfona${aberto ? ' aberta' : ''}`}>
      <button className="sanfona-cab" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <span>{titulo}</span>
        <span className="sanfona-seta" aria-hidden>
          ▾
        </span>
      </button>
      {/* corpo sempre no DOM (escondido via [hidden]) — a folha de impressão o revela no PDF */}
      <div className="sanfona-corpo" hidden={!aberto}>
        {children}
      </div>
    </div>
  )
}

/** Selo pequeno (fase da transição, esfera do tributo…). */
export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'novo' | 'antigo' | 'destaque' }) {
  return <span className={`selo selo-${tom}`}>{children}</span>
}

/**
 * Cabeçalho de relatório — invisível na tela, vira a primeira dobra do PDF
 * quando o usuário exporta a simulação (styles/print.css).
 */
export function RelatorioImpresso({ titulo, parametros }: { titulo: string; parametros: { rotulo: string; valor: string }[] }) {
  return (
    <header className="print-cab" aria-hidden>
      <p className="print-cab-marca">
        Inteligência<b>Tributária</b> · augustoneon.github.io/inteligencia-tributaria-V2
      </p>
      <h1>{titulo}</h1>
      <dl className="print-cab-params">
        {parametros.map((p) => (
          <div key={p.rotulo}>
            <dt>{p.rotulo}</dt>
            <dd>{p.valor}</dd>
          </div>
        ))}
        <div>
          <dt>Gerado em</dt>
          <dd>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</dd>
        </div>
      </dl>
      <p className="print-cab-aviso">
        Estimativa didática baseada na EC 132/2023 e na LC 214/2025 — premissas na seção "Como calculamos". Não
        substitui orientação contábil ou jurídica.
      </p>
    </header>
  )
}

/** Botão "Salvar em PDF" — abre o diálogo de impressão com a folha dedicada. */
export function BotaoPdf() {
  return (
    <button className="botao-acao" onClick={() => window.print()}>
      Salvar em PDF
    </button>
  )
}

/**
 * Compartilhar uma simulação: Web Share nativo quando o aparelho tem
 * (celulares), senão copia o link — com o mesmo feedback visual de antes.
 */
export function useCompartilharLink() {
  const [copiado, setCopiado] = useState(false)

  const compartilhar = async (url: string) => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Inteligência Tributária', url })
        return
      } catch (e) {
        // usuário fechou a folha de compartilhamento: não é erro
        if (e instanceof Error && e.name === 'AbortError') return
        // share indisponível de fato (ex.: desktop sem suporte): cai p/ o clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      // sem permissão de clipboard: a URL já está na barra de endereço
    }
  }

  return { copiado, compartilhar }
}

/** Botão de compartilhar simulação — par do useCompartilharLink. */
export function BotaoCompartilhar({ copiado, onCompartilhar }: { copiado: boolean; onCompartilhar: () => void }) {
  return (
    <button className={`botao-acao${copiado ? ' feito' : ''}`} onClick={onCompartilhar}>
      {copiado ? '✓ Link copiado' : 'Compartilhar simulação'}
    </button>
  )
}
