import { useId, useState, type ReactNode } from 'react'

export interface SerieLegenda {
  id: string
  rotulo: string
  cor: string
}

interface Props {
  titulo: string
  subtitulo?: string
  legenda?: SerieLegenda[]
  /** gêmeo em tabela — acessibilidade e leitura exata */
  tabela: { colunas: string[]; linhas: (string | number)[][] }
  criancas: ReactNode
  notaRodape?: string
}

/**
 * Moldura padrão de visualização: título, legenda, alternância gráfico/tabela.
 * Toda visualização essencial do app usa esta moldura (PRODUCT.md, princípio 5).
 */
export function VizPanel({ titulo, subtitulo, legenda, tabela, criancas, notaRodape }: Props) {
  const [modo, setModo] = useState<'grafico' | 'tabela'>('grafico')
  const id = useId()

  return (
    <figure className="viz-panel">
      <figcaption className="viz-head">
        <div>
          <h3 className="viz-title">{titulo}</h3>
          {subtitulo && <p className="viz-sub">{subtitulo}</p>}
        </div>
        <div className="viz-toggle" role="tablist" aria-label="Modo de exibição">
          <button
            role="tab"
            aria-selected={modo === 'grafico'}
            className={modo === 'grafico' ? 'on' : ''}
            onClick={() => setModo('grafico')}
          >
            Gráfico
          </button>
          <button
            role="tab"
            aria-selected={modo === 'tabela'}
            className={modo === 'tabela' ? 'on' : ''}
            onClick={() => setModo('tabela')}
          >
            Tabela
          </button>
        </div>
      </figcaption>

      {legenda && legenda.length > 1 && modo === 'grafico' && (
        <ul className="viz-legend" aria-hidden="false">
          {legenda.map((s) => (
            <li key={s.id}>
              <span className="swatch" style={{ background: s.cor }} />
              {s.rotulo}
            </li>
          ))}
        </ul>
      )}

      {modo === 'grafico' ? (
        <div className="viz-body">{criancas}</div>
      ) : (
        <div className="viz-table-wrap" tabIndex={0}>
          <table className="viz-table" aria-labelledby={id}>
            <thead>
              <tr>
                {tabela.colunas.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((cel, j) =>
                    j === 0 ? (
                      <th scope="row" key={j}>
                        {cel}
                      </th>
                    ) : (
                      <td key={j}>{cel}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {notaRodape && <p className="viz-foot">{notaRodape}</p>}
    </figure>
  )
}

/** Tooltip flutuante compartilhado pelos gráficos. */
export function ChartTip({ x, y, children, largura }: { x: number; y: number; children: ReactNode; largura: number }) {
  const flip = x > largura - 190
  return (
    <div
      className="chart-tip"
      style={{ left: x, top: y, transform: `translate(${flip ? 'calc(-100% - 14px)' : '14px'}, -50%)` }}
      role="status"
    >
      {children}
    </div>
  )
}
