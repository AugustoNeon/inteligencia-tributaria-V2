import { useMemo, useState } from 'react'
import { useMeasure } from './useMeasure'

export interface LinhaSlope {
  id: string
  rotulo: string
  /** valores em fração (0–1) */
  de: number
  para: number
  cor: string
}

interface Props {
  linhas: LinhaSlope[]
  rotuloDe: string
  rotuloPara: string
  altura?: number
  onHover?: (id: string | null) => void
  ativo?: string | null
}

const M = { topo: 34, base: 18, esq: 74, dir: 190 }

/** Resolve colisões verticais dos rótulos à direita (mín. 20px entre linhas). */
function espalhar(ys: number[], minGap = 20, topo = 0, base = Infinity) {
  const ordem = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < ordem.length; k++) {
    if (ordem[k].y - ordem[k - 1].y < minGap) ordem[k].y = ordem[k - 1].y + minGap
  }
  const estouro = ordem.length ? ordem[ordem.length - 1].y - base : 0
  if (estouro > 0) for (const o of ordem) o.y = Math.max(topo, o.y - estouro)
  const resultado = new Array<number>(ys.length)
  for (const o of ordem) resultado[o.i] = o.y
  return resultado
}

/** Slope chart: carga tributária hoje → sistema pleno, um traço por setor. */
export function Slope({ linhas, rotuloDe, rotuloPara, altura = 380, onHover, ativo }: Props) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const [hoverLocal, setHoverLocal] = useState<string | null>(null)
  const emFoco = ativo ?? hoverLocal

  const w = Math.max(width, 360)
  const compacto = w < 560
  const mDir = compacto ? 120 : M.dir
  const x0 = M.esq
  const x1 = w - mDir
  const plotH = altura - M.topo - M.base

  const maxV = Math.max(...linhas.map((l) => Math.max(l.de, l.para))) * 1.12
  const y = (v: number) => M.topo + plotH * (1 - v / maxV)

  const yLabels = useMemo(
    () => espalhar(linhas.map((l) => y(l.para)), 20, M.topo + 6, M.topo + plotH - 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linhas, plotH, maxV],
  )
  const yLabelsEsq = useMemo(
    () => espalhar(linhas.map((l) => y(l.de)), 15, M.topo + 6, M.topo + plotH - 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linhas, plotH, maxV],
  )

  const pctFmt = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  const marcar = (id: string | null) => {
    setHoverLocal(id)
    onHover?.(id)
  }

  return (
    <div ref={ref} className="chart-holder" style={{ height: altura }}>
      <svg width={w} height={altura} role="img" aria-label={`Comparação da carga tributária: ${rotuloDe} versus ${rotuloPara}`}>
        {/* colunas */}
        <line x1={x0} x2={x0} y1={M.topo} y2={M.topo + plotH} className="slope-axis" />
        <line x1={x1} x2={x1} y1={M.topo} y2={M.topo + plotH} className="slope-axis" />
        <text x={x0} y={M.topo - 14} textAnchor="middle" className="slope-col">
          {rotuloDe}
        </text>
        <text x={x1} y={M.topo - 14} textAnchor="middle" className="slope-col">
          {rotuloPara}
        </text>

        {linhas.map((l, i) => {
          const apagado = emFoco !== null && emFoco !== l.id
          const yLbl = yLabels[i]
          const precisaGuia = Math.abs(yLbl - y(l.para)) > 7
          return (
            <g
              key={l.id}
              className={`slope-line${apagado ? ' dim' : ''}`}
              onMouseEnter={() => marcar(l.id)}
              onMouseLeave={() => marcar(null)}
            >
              {/* trilho de acerto generoso (invisível) */}
              <line x1={x0} x2={x1} y1={y(l.de)} y2={y(l.para)} stroke="transparent" strokeWidth={18} />
              <line x1={x0} x2={x1} y1={y(l.de)} y2={y(l.para)} style={{ stroke: l.cor, strokeWidth: 2 }} strokeLinecap="round" />
              <circle cx={x0} cy={y(l.de)} r={4.5} style={{ fill: l.cor }} className="dot-ring" />
              <circle cx={x1} cy={y(l.para)} r={4.5} style={{ fill: l.cor }} className="dot-ring" />
              {Math.abs(yLabelsEsq[i] - y(l.de)) > 7 && (
                <line x1={x0 - 16} x2={x0 - 6} y1={yLabelsEsq[i]} y2={y(l.de)} className="leader" />
              )}
              <text x={x0 - 20} y={yLabelsEsq[i] + 4} textAnchor="end" className="slope-num">
                {pctFmt(l.de)}
              </text>
              {precisaGuia && (
                <line x1={x1 + 6} x2={x1 + 16} y1={y(l.para)} y2={yLbl} className="leader" />
              )}
              <text x={x1 + 20} y={yLbl + 4} className="slope-label">
                <tspan className="slope-num-strong">{pctFmt(l.para)}</tspan>
                {!compacto && <tspan dx={7} className="slope-name">{l.rotulo}</tspan>}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
