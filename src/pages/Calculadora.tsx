import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CabecalhoPagina } from '../components/layout/Shell'
import { CompareBars } from '../components/charts/CompareBars'
import { VizPanel } from '../components/charts/VizPanel'
import { Callout, Campo, EntradaNumero, Sanfona, Segmentado, StatTile } from '../components/ui/kit'
import { CATEGORIAS, CATEGORIA_PADRAO } from '../data/categorias'
import { ICMS_UF, UF_PADRAO, icmsDaUf } from '../data/icmsUf'
import { ANOS_SIMULAVEIS } from '../data/transicao'
import { comparar, trajetoriaPreco } from '../lib/engine'
import { brl, pct, pctDelta } from '../lib/format'
import { CORES } from '../data/tributos'

const GRUPOS = ['Produtos', 'Serviços', 'Regimes favorecidos'] as const

export function Calculadora() {
  // estado inicial pode vir da URL — links de simulação compartilháveis
  const [params, setParams] = useSearchParams()
  const [preco, setPreco] = useState(() => {
    const v = Number(params.get('preco'))
    return Number.isFinite(v) && v > 0 ? v : 1000
  })
  const [catId, setCatId] = useState(() =>
    CATEGORIAS.some((c) => c.id === params.get('cat')) ? (params.get('cat') as string) : CATEGORIA_PADRAO,
  )
  const [ano, setAno] = useState(() => {
    const a = Number(params.get('ano'))
    return ANOS_SIMULAVEIS.includes(a) ? a : 2033
  })
  const [uf, setUf] = useState(() =>
    ICMS_UF.some((u) => u.uf === params.get('uf')) ? (params.get('uf') as string) : UF_PADRAO,
  )
  const [icmsPct, setIcmsPct] = useState<number | null>(() => {
    const v = params.get('icms')
    return v !== null && Number.isFinite(Number(v)) ? Number(v) : null
  })
  const [issPct, setIssPct] = useState<number | null>(() => {
    const v = params.get('iss')
    return v !== null && Number.isFinite(Number(v)) ? Number(v) : null
  })
  const [copiado, setCopiado] = useState(false)

  // colar um link compartilhado com a página já aberta também re-sincroniza o formulário
  useEffect(() => {
    if (![...params.keys()].length) return
    const p = Number(params.get('preco'))
    if (Number.isFinite(p) && p > 0) setPreco(p)
    const c = params.get('cat')
    if (c && CATEGORIAS.some((x) => x.id === c)) setCatId(c)
    const a = Number(params.get('ano'))
    if (ANOS_SIMULAVEIS.includes(a)) setAno(a)
    const u = params.get('uf')
    if (u && ICMS_UF.some((x) => x.uf === u)) setUf(u)
    const icms = params.get('icms')
    if (icms !== null && Number.isFinite(Number(icms))) setIcmsPct(Number(icms))
    const iss = params.get('iss')
    if (iss !== null && Number.isFinite(Number(iss))) setIssPct(Number(iss))
  }, [params])

  const categoria = CATEGORIAS.find((c) => c.id === catId)!
  // categorias com alíquota modal seguem o ICMS do estado selecionado
  const icmsBase = categoria.icmsModal ? icmsDaUf(uf).aliquota : categoria.atual.icms

  const perfil = useMemo(
    () => ({
      ...categoria.atual,
      icms: categoria.atual.icms !== undefined ? (icmsPct !== null ? icmsPct / 100 : icmsBase) : undefined,
      iss: categoria.atual.iss !== undefined && issPct !== null ? issPct / 100 : categoria.atual.iss,
    }),
    [categoria, icmsPct, issPct, icmsBase],
  )

  const r = useMemo(() => comparar(preco, categoria, perfil, ano), [preco, categoria, perfil, ano])
  const trajetoria = useMemo(() => trajetoriaPreco(preco, categoria, perfil), [preco, categoria, perfil])

  const trocarCategoria = (id: string) => {
    setCatId(id)
    setIcmsPct(null)
    setIssPct(null)
  }

  const trocarUf = (novaUf: string) => {
    setUf(novaUf)
    setIcmsPct(null)
  }

  const copiarLink = async () => {
    const q = new URLSearchParams({ preco: String(preco), cat: catId, ano: String(ano) })
    if (categoria.icmsModal) q.set('uf', uf)
    if (icmsPct !== null) q.set('icms', String(icmsPct))
    if (issPct !== null) q.set('iss', String(issPct))
    setParams(q, { replace: true })
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/calculadora?${q.toString()}`)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      // sem permissão de clipboard: a URL já está na barra de endereço
    }
  }

  const legenda = [
    { id: 'liquido', rotulo: 'Preço sem tributos', cor: 'oklch(0.945 0.01 210)' },
    ...['icms', 'iss', 'piscofins', 'ipi', 'cbs', 'ibs']
      .map((id) => {
        const item = [...r.hoje.itens, ...r.novo.itens].find((i) => i.id === id)
        return item ? { id, rotulo: item.sigla, cor: item.cor } : null
      })
      .filter((x): x is { id: string; rotulo: string; cor: string } => x !== null),
  ]

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="calc://hoje-vs-2033"
        titulo="Quanto custa hoje, quanto vai custar"
        descricao="Informe um preço de hoje (com impostos embutidos) e veja a mesma compra sob o novo sistema — em 2033 ou em qualquer ano da transição. Premissa central: o vendedor repassa integralmente a diferença de imposto."
      />

      <div className="conteudo">
        <div className="calc-layout">
          <aside className="calc-form">
            <Campo label="Preço de hoje" sufixo="com impostos">
              <EntradaNumero valor={preco} onMudar={setPreco} min={0} passo={50} prefixo="R$" />
            </Campo>

            <Campo label="O que está sendo vendido">
              <select value={catId} onChange={(e) => trocarCategoria(e.target.value)}>
                {GRUPOS.map((g) => (
                  <optgroup key={g} label={g}>
                    {CATEGORIAS.filter((c) => c.grupo === g).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.rotulo}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>
            <p className="calc-cat-desc">{categoria.descricao}</p>
            <p className="calc-cat-ref mono">{categoria.refLegal}</p>

            {categoria.icmsModal && (
              <Campo label="Estado da operação" sufixo="ICMS" dica="Alíquota modal interna de referência (2025) — ajuste fino em Ajustes avançados">
                <select value={uf} onChange={(e) => trocarUf(e.target.value)}>
                  {ICMS_UF.map((u) => (
                    <option key={u.uf} value={u.uf}>
                      {u.uf} — {u.nome} ({(u.aliquota * 100).toLocaleString('pt-BR')}%)
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            <Campo label="Ano da simulação">
              <Segmentado
                ariaLabel="Ano da simulação"
                opcoes={ANOS_SIMULAVEIS.map((a) => ({ valor: a, rotulo: String(a) }))}
                valor={ano}
                onMudar={setAno}
              />
            </Campo>

            <Sanfona titulo="Ajustes avançados">
              {categoria.atual.icms !== undefined && (
                <Campo
                  label="ICMS da operação"
                  sufixo="% por dentro"
                  dica={categoria.icmsModal ? `Padrão: alíquota modal de ${uf}` : 'Padrão: alíquota típica desta categoria'}
                >
                  <EntradaNumero
                    valor={icmsPct ?? (icmsBase ?? 0) * 100}
                    onMudar={(v) => setIcmsPct(v)}
                    min={0}
                    max={30}
                    passo={0.5}
                  />
                </Campo>
              )}
              {categoria.atual.iss !== undefined && (
                <Campo label="ISS do seu município" sufixo="% (2 a 5)">
                  <EntradaNumero
                    valor={issPct ?? categoria.atual.iss * 100}
                    onMudar={(v) => setIssPct(v)}
                    min={0}
                    max={5}
                    passo={0.5}
                  />
                </Campo>
              )}
              {categoria.atual.icms === undefined && categoria.atual.iss === undefined && (
                <p>Esta categoria não tem parâmetros regionais para ajustar.</p>
              )}
            </Sanfona>
          </aside>

          <div className="calc-resultado">
            <div className="calc-share">
              <button className={`botao-acao${copiado ? ' feito' : ''}`} onClick={copiarLink}>
                {copiado ? '✓ Link copiado' : 'Copiar link da simulação'}
              </button>
            </div>
            <div className="calc-tiles">
              <StatTile
                label={`Preço estimado em ${ano}`}
                valor={brl(r.novo.precoFinal)}
                contexto={`${pctDelta(r.deltaPreco / r.hoje.precoFinal)} vs. hoje`}
                tom={r.deltaPreco > 0.01 ? 'antigo' : 'novo'}
              />
              <StatTile
                label="Carga sobre o preço"
                valor={`${pct(r.hoje.carga)} → ${pct(r.novo.carga)}`}
                contexto="fatia do preço final que é tributo"
              />
              <StatTile
                label="Alíquota do IVA p/ esta categoria"
                valor={pct(r.aliquotaIvaEfetiva)}
                contexto={
                  categoria.reducao > 0
                    ? categoria.reducao === 1
                      ? 'alíquota zero'
                      : `redução de ${categoria.reducao * 100}% sobre 26,5%`
                    : 'alíquota padrão de referência'
                }
              />
            </div>

            <VizPanel
              titulo="A mesma compra, dois sistemas"
              subtitulo="Comprimento da barra = preço final; segmentos = para onde vai cada real"
              legenda={legenda}
              tabela={{
                colunas: ['Cenário', 'Preço final', 'Sem tributos', ...legenda.slice(1).map((l) => l.rotulo), 'Carga'],
                linhas: [r.hoje, r.novo].map((c) => [
                  c.rotulo,
                  brl(c.precoFinal),
                  brl(c.precoSemImposto),
                  ...legenda.slice(1).map((l) => {
                    const item = c.itens.find((i) => i.id === l.id)
                    return item ? brl(item.valor) : '—'
                  }),
                  pct(c.carga),
                ]),
              }}
              criancas={<CompareBars cenarios={[r.hoje, r.novo]} />}
            />

            <VizPanel
              titulo="Trajetória do preço na transição"
              subtitulo="O mesmo item, simulado em cada ano — a mudança não acontece de uma vez"
              tabela={{
                colunas: ['Ano', 'Preço estimado', 'Carga'],
                linhas: trajetoria.map(({ ano: a, cenario }) => [a, brl(cenario.precoFinal), pct(cenario.carga)]),
              }}
              criancas={<TrajetoriaLinha pontos={trajetoria.map(({ ano: a, cenario }) => ({ ano: a, preco: cenario.precoFinal }))} precoHoje={r.hoje.precoFinal} anoAtivo={ano} />}
            />

            <Sanfona titulo="Como calculamos (todas as premissas)">
              <ul>
                <li>
                  <strong>Sistema atual:</strong> tributos "por dentro" — cada alíquota é aplicada como fração do preço
                  final informado. Perfil desta categoria:{' '}
                  {[
                    perfil.icms !== undefined && `ICMS ${pct(perfil.icms)}`,
                    perfil.iss !== undefined && `ISS ${pct(perfil.iss)}`,
                    `PIS/Cofins ${pct(perfil.pisCofins)}`,
                    perfil.ipi !== undefined && `IPI ${pct(perfil.ipi)}`,
                  ]
                    .filter(Boolean)
                    .join(' + ')}
                  .
                </li>
                <li>
                  <strong>Preço sem tributos:</strong> preço de hoje menos os tributos por dentro. Premissa de{' '}
                  <em>repasse integral</em>: esse valor não muda na troca de sistema.
                </li>
                <li>
                  <strong>Sistema novo:</strong> CBS/IBS "por fora" sobre o preço sem tributos, com a alíquota de
                  referência estimada (CBS 8,8% + IBS 17,7%) e a redução da categoria. Nos anos de convivência
                  (2027–2032), ICMS/ISS continuam por dentro com o fator do ano (90%, 80%, 70%, 60%).
                </li>
                <li>
                  <strong>Fora do modelo:</strong> créditos ao longo da cadeia, Simples Nacional, regimes específicos,
                  Imposto Seletivo, substituição tributária e disputas de repasse. O resultado é uma estimativa didática
                  — não uma previsão de preço.
                </li>
              </ul>
            </Sanfona>

            {categoria.notas && (
              <Callout tom="info" titulo="Notas desta categoria">
                <ul>
                  {categoria.notas.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </Callout>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Linha simples: preço estimado por ano da transição. */
import { useMeasure } from '../components/charts/useMeasure'

function TrajetoriaLinha({ pontos, precoHoje, anoAtivo }: { pontos: { ano: number; preco: number }[]; precoHoje: number; anoAtivo: number }) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const w = Math.max(width, 300)
  const h = 180
  const M = { topo: 14, dir: 18, base: 26, esq: 48 }
  const valores = [...pontos.map((p) => p.preco), precoHoje]
  const min = Math.min(...valores) * 0.985
  const max = Math.max(...valores) * 1.015
  const x = (i: number) => M.esq + ((w - M.esq - M.dir) * i) / (pontos.length - 1)
  const y = (v: number) => M.topo + (h - M.topo - M.base) * (1 - (v - min) / (max - min || 1))
  const d = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.preco)}`).join(' ')

  return (
    <div ref={ref} className="chart-holder" style={{ height: h }}>
      <svg width={w} height={h} role="img" aria-label="Preço estimado por ano da transição">
        <line x1={M.esq} x2={w - M.dir} y1={y(precoHoje)} y2={y(precoHoje)} className="linha-referencia" />
        <text x={w - M.dir} y={y(precoHoje) - 6} textAnchor="end" className="axis-num">
          hoje · {brl(precoHoje)}
        </text>
        <path d={d} style={{ fill: 'none', stroke: CORES.cbs, strokeWidth: 2 }} strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((p, i) => (
          <g key={p.ano}>
            <circle
              cx={x(i)}
              cy={y(p.preco)}
              r={p.ano === anoAtivo ? 5.5 : 4}
              style={{ fill: p.ano === anoAtivo ? CORES.cbs : 'var(--bg)', stroke: CORES.cbs, strokeWidth: 2 }}
            />
            <text x={x(i)} y={h - 8} textAnchor="middle" className={`axis-num${p.ano === anoAtivo ? ' axis-num-on' : ''}`}>
              {String(p.ano).slice(2)}
            </text>
          </g>
        ))}
        <text x={M.esq - 8} y={y(max) + 10} textAnchor="end" className="axis-num">
          {Math.round(max).toLocaleString('pt-BR')}
        </text>
        <text x={M.esq - 8} y={y(min)} textAnchor="end" className="axis-num">
          {Math.round(min).toLocaleString('pt-BR')}
        </text>
      </svg>
    </div>
  )
}
