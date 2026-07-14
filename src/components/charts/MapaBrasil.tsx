import { useState } from 'react'
import { BRASIL_UFS, MAPA_ALTURA, MAPA_LARGURA } from '../../data/brasilUfPaths'

interface Props {
  /** UF → alíquota (fração) */
  valores: Record<string, number>
  selecionado: string
  onSelecionar: (uf: string) => void
}

/**
 * Coroplético do Brasil: alíquota modal de ICMS por UF, clicável.
 * Escala binada na família cobre (ICMS = sistema antigo, ver DESIGN.md).
 * O <select> de UF ao lado é o gêmeo acessível — o mapa é a via de ponteiro.
 */

const BINS = [
  { ate: 0.175, rotulo: '17%' },
  { ate: 0.185, rotulo: '18%' },
  { ate: 0.1975, rotulo: '19–19,5%' },
  { ate: 0.21, rotulo: '20–20,5%' },
  { ate: Infinity, rotulo: '22–23%' },
]

const bin = (v: number) => BINS.findIndex((b) => v <= b.ate) + 1

/**
 * Ajuste fino da posição dos rótulos: estados estreitos do litoral nordestino
 * ganham deslocamento para o mar (prática cartográfica padrão; o halo do
 * texto garante a leitura sobre qualquer fundo). Unidades do viewBox.
 */
const NUDGE: Record<string, [number, number]> = {
  RN: [14, -3],
  PB: [19, 3],
  PE: [-16, 3],
  AL: [15, 4],
  SE: [10, 9],
  DF: [11, -5],
  RJ: [9, 7],
}

const pctIcms = (v: number) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export function MapaBrasil({ valores, selecionado, onSelecionar }: Props) {
  const [tip, setTip] = useState<{ uf: string; x: number; y: number } | null>(null)

  const ativa = BRASIL_UFS.find((u) => u.uf === selecionado)
  const emTip = tip ? BRASIL_UFS.find((u) => u.uf === tip.uf) : null

  const mover = (uf: string) => (e: React.MouseEvent<SVGPathElement>) => {
    const holder = (e.currentTarget.closest('.mapa-holder') as HTMLElement).getBoundingClientRect()
    setTip({ uf, x: e.clientX - holder.left, y: e.clientY - holder.top - 12 })
  }

  return (
    <div className="mapa-holder" onMouseLeave={() => setTip(null)}>
      <svg
        viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
        className="mapa-svg"
        role="img"
        aria-label="Mapa do Brasil com a alíquota modal de ICMS de cada estado — clique em um estado para usá-lo na simulação; o seletor de estado acima é equivalente"
      >
        {BRASIL_UFS.map((u) => (
          <path
            key={u.uf}
            d={u.d}
            className="mapa-uf"
            style={{ fill: `var(--mapa-b${bin(valores[u.uf] ?? 0)})` }}
            onClick={() => onSelecionar(u.uf)}
            onMouseMove={mover(u.uf)}
          />
        ))}
        {ativa && <path d={ativa.d} className="mapa-uf-contorno" />}
        {BRASIL_UFS.map((u) => {
          const [dx, dy] = NUDGE[u.uf] ?? [0, 0]
          return (
            <text
              key={u.uf}
              x={u.rotuloX + dx}
              y={u.rotuloY + dy}
              className={`mapa-sigla${u.uf === selecionado ? ' on' : ''}`}
              aria-hidden
            >
              {u.uf}
            </text>
          )
        })}
      </svg>

      <ul className="mapa-legenda" aria-label="Faixas de alíquota de ICMS">
        {BINS.map((b, i) => (
          <li key={b.rotulo}>
            <span className="swatch" style={{ background: `var(--mapa-b${i + 1})` }} />
            {b.rotulo}
          </li>
        ))}
      </ul>

      {tip && emTip && (
        <div className="chart-tip mapa-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <strong>{emTip.nome}</strong> · ICMS {pctIcms(valores[tip.uf] ?? 0)}
        </div>
      )}
    </div>
  )
}
