import { useState } from 'react'
import type { Cenario } from '../../lib/engine'
import { brl, pct } from '../../lib/format'

interface Props {
  cenarios: Cenario[]
}

const COR_LIQUIDO = 'var(--surface-2)'

/**
 * Barras horizontais empilhadas comparando cenários (hoje × novo sistema).
 * O comprimento é o preço final; segmentos = preço sem imposto + cada tributo.
 * Larguras animadas por CSS — o gráfico "respira" quando os inputs mudam.
 */
export function CompareBars({ cenarios }: Props) {
  const [tip, setTip] = useState<{ chave: string; texto: string; x: number; y: number } | null>(null)
  const maxPreco = Math.max(...cenarios.map((c) => c.precoFinal), 1)

  return (
    <div className="cbars" onMouseLeave={() => setTip(null)}>
      {cenarios.map((c) => (
        <div className="cbars-row" key={c.rotulo}>
          <div className="cbars-meta">
            <span className="cbars-label">{c.rotulo}</span>
            <span className="cbars-total">{brl(c.precoFinal)}</span>
          </div>
          <div className="cbars-track" role="img" aria-label={`${c.rotulo}: preço final ${brl(c.precoFinal)}, impostos ${brl(c.totalImpostos)} (${pct(c.carga)})`}>
            <div
              className="cbars-seg cbars-liquido"
              style={{ width: `${(c.precoSemImposto / maxPreco) * 100}%`, background: COR_LIQUIDO }}
              onMouseMove={(e) => posTip(e, `${c.rotulo}-liq`, `Preço sem tributos · ${brl(c.precoSemImposto)}`, setTip)}
            />
            {c.itens.map((item) => (
              <div
                key={item.id}
                className="cbars-seg"
                style={{ width: `${(item.valor / maxPreco) * 100}%`, background: item.cor }}
                onMouseMove={(e) =>
                  posTip(
                    e,
                    `${c.rotulo}-${item.id}`,
                    `${item.sigla} · ${brl(item.valor)} (${pct(item.valor / c.precoFinal)} do preço)`,
                    setTip,
                  )
                }
              />
            ))}
          </div>
          <div className="cbars-carga">
            <span className="mono">{pct(c.carga)}</span> do preço em tributos
            {c.anoTeste && <em className="cbars-nota"> · ano-teste: destaque compensável, carga inalterada</em>}
          </div>
        </div>
      ))}
      {tip && (
        <div className="chart-tip cbars-tip" style={{ left: tip.x, top: tip.y }} role="status">
          {tip.texto}
        </div>
      )}
    </div>
  )
}

function posTip(
  e: React.MouseEvent<HTMLDivElement>,
  chave: string,
  texto: string,
  set: (t: { chave: string; texto: string; x: number; y: number }) => void,
) {
  const wrap = (e.currentTarget.closest('.cbars') as HTMLElement).getBoundingClientRect()
  set({ chave, texto, x: e.clientX - wrap.left, y: e.clientY - wrap.top - 34 })
}
