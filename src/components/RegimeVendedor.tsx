import { useState } from 'react'
import { useMeasure } from './charts/useMeasure'
import { Callout, Campo, EntradaNumero, Segmentado, Selo } from './ui/kit'
import { LIMITES_REGIME, compararCredito, opcoesDoVendedor } from '../lib/regime'
import { brl, pct } from '../lib/format'

/**
 * "Dentro ou fora do IVA?" — o outro lado do balcão da calculadora:
 * onde um pequeno negócio se encaixa (nanoempreendedor, MEI, Simples,
 * produtor rural, regime regular) e o crédito que cada escolha
 * transfere a clientes empresas.
 */
export function RegimeVendedor({ aliquotaIva, categoriaRotulo }: { aliquotaIva: number; categoriaRotulo: string }) {
  const [receita, setReceita] = useState(120_000)
  const [rural, setRural] = useState<'nao' | 'sim'>('nao')
  const [dasPct, setDasPct] = useState(3)

  const opcoes = opcoesDoVendedor(receita, rural === 'sim').filter((o) => o.disponivel)
  const credito = compararCredito(1000, aliquotaIva, dasPct / 100)

  return (
    <div className="regime-grid">
      <aside className="regime-form">
        <Campo label="Receita anual do negócio" sufixo="R$/ano">
          <EntradaNumero valor={receita} onMudar={setReceita} min={0} passo={10_000} prefixo="R$" />
        </Campo>
        <Campo label="Atividade rural?" dica="Produtor rural com receita até R$ 3,6 mi/ano pode optar por ficar fora do IVA">
          <Segmentado
            ariaLabel="Atividade rural"
            opcoes={[
              { valor: 'nao', rotulo: 'Não' },
              { valor: 'sim', rotulo: 'Sim' },
            ]}
            valor={rural}
            onMudar={setRural}
          />
        </Campo>
        <Campo
          label="CBS/IBS dentro do seu DAS"
          sufixo="% da receita"
          dica="Parcela da guia do Simples que corresponde a CBS/IBS — depende do anexo e da faixa; 3% é ilustrativo"
        >
          <EntradaNumero valor={dasPct} onMudar={setDasPct} min={0} max={15} passo={0.5} />
        </Campo>
      </aside>

      <div className="regime-resultado">
        <ReguaReceita receita={receita} />

        <div className="regime-ops">
          {opcoes.map((o) => (
            <article key={o.id} className="regime-op">
              <header>
                <h3>{o.rotulo}</h3>
                <Selo tom={o.dentroDoIva ? 'novo' : 'neutro'}>{o.dentroDoIva ? 'dentro do IVA' : 'fora do IVA'}</Selo>
              </header>
              <p>{o.resumo}</p>
            </article>
          ))}
        </div>

        <div className="regime-credito">
          <h3>O crédito que chega ao seu cliente empresa</h3>
          {aliquotaIva > 0 ? (
            <>
              <p className="regime-credito-desc">
                A cada <strong className="mono">R$ 1.000</strong> vendidos em "{categoriaRotulo}" (alíquota efetiva de{' '}
                {pct(aliquotaIva)}):
              </p>
              <div className="regime-barras">
                <BarraCredito rotulo="No Simples, por dentro do DAS" valor={credito.porDentro} max={credito.porFora} tom="limitado" />
                <BarraCredito rotulo="CBS/IBS por fora (regime regular)" valor={credito.porFora} max={credito.porFora} tom="cheio" />
              </div>
              <p className="regime-credito-nota">
                Diferença de <strong className="mono">{brl(credito.diferenca)}</strong> por venda — é o crédito que o
                cliente PJ deixa de aproveitar quando o fornecedor recolhe tudo por dentro do Simples.
              </p>
            </>
          ) : (
            <p className="regime-credito-desc">
              "{categoriaRotulo}" tem alíquota zero: não há CBS/IBS embutidos nem crédito a transferir — a escolha de
              regime não muda nada nesse ponto.
            </p>
          )}
        </div>

        <Callout tom="info" titulo="Premissas desta seção">
          <ul>
            <li>
              Faixas da LC 214/2025: nanoempreendedor até R$ 40,5 mil/ano (metade do teto do MEI), MEI até R$ 81 mil,
              Simples Nacional até R$ 4,8 mi, produtor rural não contribuinte até R$ 3,6 mi.
            </li>
            <li>
              No Simples "por dentro", o crédito transferível se limita ao CBS/IBS efetivamente recolhido no DAS — a
              fração exata depende do anexo e da faixa de faturamento (edite o percentual ao lado).
            </li>
            <li>Vender a consumidor final? O crédito não importa — pese só simplicidade e fluxo de caixa.</li>
          </ul>
        </Callout>
      </div>
    </div>
  )
}

function BarraCredito({ rotulo, valor, max, tom }: { rotulo: string; valor: number; max: number; tom: 'cheio' | 'limitado' }) {
  const frac = max > 0 ? valor / max : 0
  return (
    <div className="regime-barra-row">
      <span className="regime-barra-label">{rotulo}</span>
      <div className="regime-barra-track" aria-hidden>
        <span
          className="regime-barra-fill"
          style={{ width: `${(frac * 100).toFixed(1)}%`, background: tom === 'cheio' ? 'var(--cor-cbs)' : 'var(--line-forte)' }}
        />
      </div>
      <span className="regime-barra-valor mono">{brl(valor)}</span>
    </div>
  )
}

/** Régua logarítmica de receita anual: faixas de regime + marcador "você". */
function ReguaReceita({ receita }: { receita: number }) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const w = Math.max(width, 320)
  const h = 96
  const M = { esq: 8, dir: 8 }
  const LO = Math.log10(10_000)
  const HI = Math.log10(10_000_000)
  const x = (v: number) => M.esq + (w - M.esq - M.dir) * ((Math.log10(Math.min(Math.max(v, 10_000), 10_000_000)) - LO) / (HI - LO))

  const bandas = [
    { de: 10_000, ate: LIMITES_REGIME.nanoempreendedor, rotulo: 'Nano', fill: 'var(--surface-2)', op: 1 },
    { de: LIMITES_REGIME.nanoempreendedor, ate: LIMITES_REGIME.mei, rotulo: 'MEI', fill: 'var(--cor-ibs)', op: 0.28 },
    { de: LIMITES_REGIME.mei, ate: LIMITES_REGIME.simples, rotulo: 'Simples Nacional', fill: 'var(--cor-ibs)', op: 0.5 },
    { de: LIMITES_REGIME.simples, ate: 10_000_000, rotulo: 'Regular', fill: 'var(--cor-cbs)', op: 0.85 },
  ]
  const marcos = [
    { v: LIMITES_REGIME.nanoempreendedor, rotulo: '40,5 mil', anchor: 'middle' },
    { v: LIMITES_REGIME.mei, rotulo: '81 mil', anchor: 'middle' },
    { v: LIMITES_REGIME.produtorRural, rotulo: '3,6 mi', anchor: 'end' },
    { v: LIMITES_REGIME.simples, rotulo: '4,8 mi', anchor: 'start' },
  ] as const

  const yBanda = 40
  const hBanda = 18
  const xVoce = x(receita)

  return (
    <div ref={ref} className="chart-holder regime-regua" style={{ height: h }}>
      <svg width={w} height={h} role="img" aria-label="Régua de receita anual com as faixas de regime: nanoempreendedor até 40,5 mil, MEI até 81 mil, Simples Nacional até 4,8 milhões, regime regular acima disso">
        {bandas.map((b) => {
          const larg = x(b.ate) - x(b.de)
          return (
            <g key={b.rotulo}>
              <rect x={x(b.de)} y={yBanda} width={larg} height={hBanda} rx={3} style={{ fill: b.fill, fillOpacity: b.op }} />
              {larg > 46 && (
                <text x={x(b.de) + larg / 2} y={yBanda - 7} textAnchor="middle" className="axis-num">
                  {b.rotulo}
                </text>
              )}
            </g>
          )
        })}
        {marcos.map((m) => (
          <g key={m.v}>
            <line x1={x(m.v)} x2={x(m.v)} y1={yBanda - 3} y2={yBanda + hBanda + 3} className="regime-marco" />
            <text x={x(m.v)} y={yBanda + hBanda + 17} textAnchor={m.anchor} className="axis-num">
              {m.rotulo}
            </text>
          </g>
        ))}
        {/* marcador "você está aqui" */}
        <path d={`M${xVoce - 5},${yBanda - 12} L${xVoce + 5},${yBanda - 12} L${xVoce},${yBanda - 4} Z`} style={{ fill: 'var(--petrol-bright)' }} />
        <text x={xVoce} y={yBanda - 17} textAnchor="middle" className="axis-num axis-num-on">
          você
        </text>
      </svg>
    </div>
  )
}
