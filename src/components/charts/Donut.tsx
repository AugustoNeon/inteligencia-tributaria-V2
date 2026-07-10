import { useState } from 'react'
import { ChartTip } from './VizPanel'
import { useMeasure } from './useMeasure'

export interface FatiaDonut {
  id: string
  rotulo: string
  valor: number
  cor: string
}

interface Props {
  fatias: FatiaDonut[]
  /** número-herói do centro */
  centro: string
  centroRotulo: string
  formatar?: (v: number) => string
  tamanho?: number
}

/** Donut parte-de-um-todo (≤ 6 fatias), gaps de 2px na cor da superfície. */
export function Donut({ fatias, centro, centroRotulo, formatar, tamanho = 240 }: Props) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)

  const visiveis = fatias.filter((f) => f.valor > 0)
  const total = visiveis.reduce((s, f) => s + f.valor, 0)
  const raio = tamanho / 2 - 8
  const espessura = 30
  const cx = tamanho / 2
  const cy = tamanho / 2

  let anguloAcum = -Math.PI / 2
  const arcos = visiveis.map((f) => {
    const frac = total > 0 ? f.valor / total : 0
    const a0 = anguloAcum
    const a1 = a0 + frac * Math.PI * 2
    anguloAcum = a1
    return { fatia: f, a0, a1, frac }
  })

  const ponto = (ang: number, r: number) => [cx + r * Math.cos(ang), cy + r * Math.sin(ang)] as const

  const arcoPath = (a0: number, a1: number) => {
    const rExt = raio
    const rInt = raio - espessura
    const [x0, y0] = ponto(a0, rExt)
    const [x1, y1] = ponto(a1, rExt)
    const [x2, y2] = ponto(a1, rInt)
    const [x3, y3] = ponto(a0, rInt)
    const grande = a1 - a0 > Math.PI ? 1 : 0
    return `M${x0},${y0} A${rExt},${rExt} 0 ${grande} 1 ${x1},${y1} L${x2},${y2} A${rInt},${rInt} 0 ${grande} 0 ${x3},${y3} Z`
  }

  const fmt = formatar ?? ((v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))
  const emHover = hover ? visiveis.find((f) => f.id === hover.id) : null

  return (
    <div ref={ref} className="chart-holder donut-holder" style={{ height: tamanho }}>
      <svg width={tamanho} height={tamanho} role="img" aria-label={`${centroRotulo}: ${centro}`}>
        {arcos.map(({ fatia, a0, a1 }) => (
          <path
            key={fatia.id}
            d={arcoPath(a0, a1)}
            fill={fatia.cor}
            fillOpacity={hover && hover.id !== fatia.id ? 0.3 : 0.92}
            stroke="var(--bg)"
            strokeWidth={2}
            className="donut-slice"
            onMouseMove={(e) => {
              const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
              setHover({ id: fatia.id, x: e.clientX - rect.left, y: e.clientY - rect.top })
            }}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-hero">
          {centro}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="donut-hero-label">
          {centroRotulo}
        </text>
      </svg>

      {emHover && hover && (
        <ChartTip x={hover.x} y={hover.y} largura={Math.max(width, tamanho)}>
          <div className="tip-row">
            <span className="swatch" style={{ background: emHover.cor }} />
            <span className="tip-name">{emHover.rotulo}</span>
            <span className="tip-val">{fmt(emHover.valor)}</span>
          </div>
          <div className="tip-extra">{((emHover.valor / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% do total</div>
        </ChartTip>
      )}
    </div>
  )
}
