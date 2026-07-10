import { useMemo, useState } from 'react'
import { ChartTip } from './VizPanel'
import { useMeasure } from './useMeasure'

export interface SerieArea {
  id: string
  rotulo: string
  cor: string
  /** um valor por rótulo do eixo x, em pontos percentuais (0–100) */
  valores: number[]
}

interface Props {
  xRotulos: (string | number)[]
  series: SerieArea[]
  altura?: number
  /** índice selecionado no eixo x (sincroniza com painel externo) */
  selecionado?: number
  onSelecionar?: (i: number) => void
}

const MARGEM = { topo: 12, dir: 12, base: 30, esq: 40 }

/**
 * Área empilhada 0–100% — a composição da tributação do consumo ao longo da
 * transição. Hover: crosshair + tooltip; clique: seleciona o ano.
 */
export function StackedArea({ xRotulos, series, altura = 320, selecionado, onSelecionar }: Props) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const w = Math.max(width, 320)
  const plotW = w - MARGEM.esq - MARGEM.dir
  const plotH = altura - MARGEM.topo - MARGEM.base
  const n = xRotulos.length

  const x = (i: number) => MARGEM.esq + (plotW * i) / (n - 1)
  const y = (v: number) => MARGEM.topo + plotH * (1 - v / 100)

  // pilhas acumuladas: para cada série, faixa [baixo(i), alto(i)]
  const faixas = useMemo(() => {
    const acumulado = new Array<number>(n).fill(0)
    return series.map((s) => {
      const baixo = [...acumulado]
      s.valores.forEach((v, i) => (acumulado[i] += v))
      const alto = [...acumulado]
      return { serie: s, baixo, alto }
    })
  }, [series, n])

  const areaPath = (baixo: number[], alto: number[]) => {
    const ida = alto.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
    const volta = baixo
      .map((_, i) => `L${x(baixo.length - 1 - i)},${y(baixo[baixo.length - 1 - i])}`)
      .join(' ')
    return `${ida} ${volta} Z`
  }

  const idxDoEvento = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect()
    const px = clientX - rect.left
    const i = Math.round(((px - MARGEM.esq) / plotW) * (n - 1))
    return Math.min(n - 1, Math.max(0, i))
  }

  const ativo = hover ?? selecionado ?? null

  return (
    <div ref={ref} className="chart-holder" style={{ height: altura }}>
      <svg
        width={w}
        height={altura}
        role="img"
        aria-label="Gráfico de área empilhada da composição da tributação do consumo por ano"
        onMouseMove={(e) => setHover(idxDoEvento(e.clientX, e.currentTarget))}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => onSelecionar?.(idxDoEvento(e.clientX, e.currentTarget))}
        style={{ cursor: onSelecionar ? 'pointer' : 'default' }}
      >
        {/* grid horizontal recessivo */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={MARGEM.esq} x2={w - MARGEM.dir} y1={y(v)} y2={y(v)} className="grid-line" />
            <text x={MARGEM.esq - 8} y={y(v) + 4} className="axis-num" textAnchor="end">
              {v}%
            </text>
          </g>
        ))}

        {/* faixas empilhadas, separadas por 2px na cor da superfície */}
        {faixas.map(({ serie, baixo, alto }) => (
          <path
            key={serie.id}
            d={areaPath(baixo, alto)}
            fill={serie.cor}
            fillOpacity={0.82}
            stroke="var(--bg)"
            strokeWidth={2}
            strokeLinejoin="round"
            className="area-band"
          />
        ))}

        {/* eixo x */}
        {xRotulos.map((r, i) => (
          <text
            key={i}
            x={x(i)}
            y={altura - 8}
            textAnchor="middle"
            className={`axis-num${ativo === i ? ' axis-num-on' : ''}`}
          >
            {r}
          </text>
        ))}

        {/* crosshair + marcadores */}
        {ativo !== null && (
          <g>
            <line x1={x(ativo)} x2={x(ativo)} y1={MARGEM.topo} y2={MARGEM.topo + plotH} className="crosshair" />
            {faixas
              .filter(({ serie }) => serie.valores[ativo] > 0.5)
              .map(({ serie, alto }) => (
                <circle key={serie.id} cx={x(ativo)} cy={y(alto[ativo])} r={4.5} fill={serie.cor} className="dot-ring" />
              ))}
          </g>
        )}

        {/* seleção persistente (ano escolhido) */}
        {selecionado !== undefined && hover === null && (
          <line
            x1={x(selecionado)}
            x2={x(selecionado)}
            y1={MARGEM.topo}
            y2={MARGEM.topo + plotH}
            className="crosshair-fixa"
          />
        )}
      </svg>

      {ativo !== null && hover !== null && (
        <ChartTip x={x(ativo)} y={MARGEM.topo + plotH * 0.32} largura={w}>
          <strong className="tip-title">{xRotulos[ativo]}</strong>
          {series
            .filter((s) => s.valores[ativo] > 0.5)
            .map((s) => (
              <div className="tip-row" key={s.id}>
                <span className="swatch" style={{ background: s.cor }} />
                <span className="tip-name">{s.rotulo}</span>
                <span className="tip-val">{s.valores[ativo].toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
              </div>
            ))}
        </ChartTip>
      )}
    </div>
  )
}
