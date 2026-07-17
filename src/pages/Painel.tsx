import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CabecalhoPagina } from '../components/layout/Shell'
import { CompareBars } from '../components/charts/CompareBars'
import { VizPanel } from '../components/charts/VizPanel'
import { useMeasure } from '../components/charts/useMeasure'
import {
  BotaoCompartilhar,
  BotaoPdf,
  Callout,
  Campo,
  EntradaNumero,
  RelatorioImpresso,
  Sanfona,
  Segmentado,
  StatTile,
  useCompartilharLink,
} from '../components/ui/kit'
import { SALARIO_MINIMO_PADRAO } from '../data/cashback'
import { ICMS_UF, UF_PADRAO } from '../data/icmsUf'
import { CORES } from '../data/tributos'
import { simularPainel } from '../lib/painel'
import { curvaProgressividade, type PontoProgressividade } from '../lib/progressividade'
import { brl, pct, pctDelta } from '../lib/format'

/** −12,34 → "−R$ 12,34" · 12,34 → "+R$ 12,34" */
const brlAssinado = (v: number) => (v > 0 ? `+${brl(v)}` : brl(v))

export function Painel() {
  // estado inicial pode vir da URL — simulações compartilháveis
  const [params, setParams] = useSearchParams()
  const numParam = (chave: string, padrao: number) => {
    const v = Number(params.get(chave))
    return params.get(chave) !== null && Number.isFinite(v) && v >= 0 ? v : padrao
  }
  const [pessoas, setPessoas] = useState(() => Math.max(1, Math.round(numParam('pe', 4))))
  const [renda, setRenda] = useState(() => numParam('renda', 2800))
  const [cadunico, setCadunico] = useState<'sim' | 'nao'>(() => (params.get('cad') === 'nao' ? 'nao' : 'sim'))
  const [salarioMinimo, setSalarioMinimo] = useState(() => numParam('sm', SALARIO_MINIMO_PADRAO))
  const [uf, setUf] = useState(() => (ICMS_UF.some((u) => u.uf === params.get('uf')) ? (params.get('uf') as string) : UF_PADRAO))
  // consumo acompanha a renda (80%) até o usuário editar
  const [consumoManual, setConsumoManual] = useState<number | null>(() => (params.get('cons') !== null ? numParam('cons', 0) : null))
  const { copiado, compartilhar } = useCompartilharLink()

  const consumoAuto = Math.round((renda * 0.8) / 10) * 10
  const consumo = consumoManual ?? consumoAuto

  // colar um link compartilhado com a página já aberta re-sincroniza o formulário
  useEffect(() => {
    if (![...params.keys()].length) return
    setPessoas(Math.max(1, Math.round(numParam('pe', 4))))
    setRenda(numParam('renda', 2800))
    setCadunico(params.get('cad') === 'nao' ? 'nao' : 'sim')
    setSalarioMinimo(numParam('sm', SALARIO_MINIMO_PADRAO))
    const u = params.get('uf')
    if (u && ICMS_UF.some((x) => x.uf === u)) setUf(u)
    if (params.get('cons') !== null) setConsumoManual(numParam('cons', 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const compartilharLink = () => {
    const q = new URLSearchParams({
      pe: String(pessoas),
      renda: String(renda),
      cad: cadunico,
      uf,
      cons: String(consumo),
      sm: String(salarioMinimo),
    })
    setParams(q, { replace: true })
    void compartilhar(`${location.origin}${location.pathname}#/raio-x?${q.toString()}`)
  }

  const r = useMemo(
    () =>
      simularPainel({
        pessoas,
        rendaFamiliar: renda,
        inscritoCadUnico: cadunico === 'sim',
        consumo,
        uf,
        salarioMinimo,
      }),
    [pessoas, renda, cadunico, consumo, uf, salarioMinimo],
  )
  const curva = useMemo(() => curvaProgressividade(uf, salarioMinimo), [uf, salarioMinimo])

  const legenda = [
    { id: 'liquido', rotulo: 'Preço sem tributos', cor: 'oklch(0.945 0.01 210)' },
    ...['icms', 'iss', 'piscofins', 'ipi', 'cbs', 'ibs']
      .map((id) => {
        const item = [...r.cesta.hoje.itens, ...r.cesta.novo.itens].find((i) => i.id === id)
        return item ? { id, rotulo: item.sigla, cor: item.cor } : null
      })
      .filter((x): x is { id: string; rotulo: string; cor: string } => x !== null),
  ]

  const resumo = [
    { id: 'cesta', rotulo: 'Variação da cesta em 2033', valor: r.cesta.deltaMensal },
    { id: 'cashback', rotulo: 'Cashback (devolução)', valor: -r.cashback.totalMensal },
    { id: 'liquido', rotulo: 'Efeito líquido no mês', valor: r.efeitoLiquidoMensal, forte: true },
  ]

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="raiox://cesta+cashback.2033"
        titulo="O raio-X da sua família"
        descricao="Um retrato só: o consumo do mês distribuído em categorias, o custo da cesta hoje versus no sistema pleno (2033), o cashback a que a família tem direito — e o efeito líquido disso tudo no orçamento."
      />

      <div className="conteudo">
        <div className="calc-layout">
          <aside className="calc-form">
            <h2 className="form-titulo">A família</h2>
            <div className="form-par">
              <Campo label="Pessoas na família">
                <EntradaNumero valor={pessoas} onMudar={(v) => setPessoas(Math.max(1, Math.round(v)))} min={1} max={15} />
              </Campo>
              <Campo label="Renda familiar mensal">
                <EntradaNumero valor={renda} onMudar={setRenda} min={0} passo={100} prefixo="R$" />
              </Campo>
            </div>
            <Campo label="Inscrita no CadÚnico?">
              <Segmentado
                ariaLabel="Inscrição no CadÚnico"
                opcoes={[
                  { valor: 'sim', rotulo: 'Sim' },
                  { valor: 'nao', rotulo: 'Não' },
                ]}
                valor={cadunico}
                onMudar={setCadunico}
              />
            </Campo>
            <Campo
              label="Consumo mensal da família"
              dica={consumoManual === null ? 'Pré-preenchido como 80% da renda — edite à vontade' : 'Distribuído pelos pesos da seção "Como calculamos"'}
            >
              <EntradaNumero valor={consumo} onMudar={(v) => setConsumoManual(v)} min={0} passo={100} prefixo="R$" />
            </Campo>
            <Campo label="Estado (ICMS dos produtos)">
              <select value={uf} onChange={(e) => setUf(e.target.value)}>
                {ICMS_UF.map((u) => (
                  <option key={u.uf} value={u.uf}>
                    {u.uf} — {u.nome} ({(u.aliquota * 100).toLocaleString('pt-BR')}%)
                  </option>
                ))}
              </select>
            </Campo>
            <Sanfona titulo="Parâmetro: salário mínimo">
              <Campo label="Salário mínimo vigente" dica="Usado no teste de renda do cashback (meio salário por pessoa)">
                <EntradaNumero valor={salarioMinimo} onMudar={setSalarioMinimo} min={0} passo={10} prefixo="R$" />
              </Campo>
            </Sanfona>
          </aside>

          <div className="calc-resultado">
            <RelatorioImpresso
              titulo="Raio-X da família — cesta e cashback no sistema pleno (2033)"
              parametros={[
                { rotulo: 'Pessoas', valor: String(pessoas) },
                { rotulo: 'Renda mensal', valor: brl(renda) },
                { rotulo: 'Consumo mensal', valor: brl(consumo) },
                { rotulo: 'CadÚnico', valor: cadunico === 'sim' ? 'Sim' : 'Não' },
                { rotulo: 'Estado', valor: uf },
              ]}
            />
            <div className="calc-share">
              <BotaoPdf />
              <BotaoCompartilhar copiado={copiado} onCompartilhar={compartilharLink} />
            </div>

            <div className={`elegibilidade ${r.cashback.elegivel ? 'ok' : 'nao'}`} role="status">
              {r.cashback.elegivel ? (
                <>
                  <strong>Família elegível ao cashback.</strong> Renda por pessoa de {brl(r.cashback.rendaPerCapita)} —
                  dentro do limite de {brl(r.cashback.limite)} (meio salário mínimo).
                </>
              ) : (
                <>
                  <strong>Sem cashback neste retrato:</strong>{' '}
                  {cadunico === 'nao'
                    ? 'a devolução exige inscrição no CadÚnico.'
                    : `renda por pessoa de ${brl(r.cashback.rendaPerCapita)} acima do teto de ${brl(r.cashback.limite)}.`}{' '}
                  O efeito líquido abaixo é só a variação da cesta.
                </>
              )}
            </div>

            <div className="calc-tiles">
              <StatTile
                label="Cesta de consumo em 2033"
                valor={brl(r.cesta.novo.precoFinal)}
                contexto={`${pctDelta(r.cesta.hoje.precoFinal > 0 ? r.cesta.deltaMensal / r.cesta.hoje.precoFinal : 0)} vs. hoje`}
                tom={r.cesta.deltaMensal > 0.01 ? 'antigo' : 'novo'}
              />
              <StatTile
                label="Cashback mensal"
                valor={brl(r.cashback.totalMensal)}
                contexto={r.cashback.elegivel ? 'devolvido no CPF da família' : 'família não elegível'}
                tom="novo"
              />
              <StatTile
                label="Efeito líquido no mês"
                valor={brlAssinado(r.efeitoLiquidoMensal)}
                contexto={`${brlAssinado(r.efeitoLiquidoAnual)} em 12 meses`}
                tom={r.efeitoLiquidoMensal > 0.01 ? 'antigo' : 'novo'}
              />
            </div>

            <VizPanel
              titulo="O saldo do novo sistema para esta família"
              subtitulo="Variação da cesta, devolução do cashback e o resultado líquido — cobre pesa, petróleo alivia"
              tabela={{
                colunas: ['Componente', 'R$/mês'],
                linhas: resumo.map((l) => [l.rotulo, brlAssinado(l.valor)]),
              }}
              criancas={<ResumoLiquido linhas={resumo} />}
            />

            <VizPanel
              titulo="A cesta da família, dois sistemas"
              subtitulo={`Consumo distribuído em 8 categorias (${brl(r.consumoCesta)}); contas essenciais (${brl(r.consumoContas)}) entram só no cashback`}
              legenda={legenda}
              tabela={{
                colunas: ['Cenário', 'Custo do mês', 'Sem tributos', ...legenda.slice(1).map((l) => l.rotulo), 'Carga'],
                linhas: [r.cesta.hoje, r.cesta.novo].map((c) => [
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
              criancas={<CompareBars cenarios={[r.cesta.hoje, r.cesta.novo]} />}
            />

            <VizPanel
              titulo="Quem paga mais? A carga por faixa de renda"
              subtitulo="Tributos de consumo como fração da renda familiar — hoje, no sistema pleno e depois do cashback"
              legenda={[
                { id: 'hoje', rotulo: 'Hoje', cor: CORES.icms },
                { id: 'nova', rotulo: 'Sistema pleno (2033)', cor: CORES.cbs },
                { id: 'cashback', rotulo: 'Depois do cashback', cor: CORES.ibs },
              ]}
              tabela={{
                colunas: ['Renda familiar', 'Carga hoje', 'Em 2033', 'Com cashback', 'Cashback/mês'],
                linhas: curva.map((p) => [
                  `${p.faixa.rotulo}/mês`,
                  pct(p.cargaHoje),
                  pct(p.cargaNova),
                  pct(p.cargaComCashback),
                  p.cashbackMensal > 0 ? brl(p.cashbackMensal) : '—',
                ]),
              }}
              notaRodape="Perfis ilustrativos de famílias de 4 pessoas (não são microdados da POF/IBGE): a fração consumida da renda e a composição do consumo variam por faixa — premissas em “Como calculamos”."
              criancas={<CurvaProgressividade curva={curva} />}
            />

            {r.cashback.elegivel && r.efeitoLiquidoMensal < 0 && (
              <Callout tom="info" titulo="Leitura do retrato">
                Somando a variação da cesta e a devolução do cashback, esta família termina o mês com{' '}
                <strong>{brl(-r.efeitoLiquidoMensal)} a mais</strong> no orçamento sob o novo sistema.
              </Callout>
            )}

            <Sanfona titulo="Como calculamos (todas as premissas)">
              <ul>
                <li>
                  <strong>Retrato fixo no sistema pleno (2033):</strong> mesmas premissas da calculadora — tributos por
                  dentro hoje, CBS/IBS por fora, repasse integral de diferenças ao preço.
                </li>
                <li>
                  <strong>Distribuição do consumo:</strong> 85,5% na cesta (cesta básica 22%, outros alimentos 16%,
                  vestuário/casa 14%, medicamentos 5%, saúde 7%, educação 8%, transporte público 6%, demais serviços
                  7,5%) e 14,5% em contas essenciais (energia 5,5%, água 2,5%, gás 2%, telecom 4,5%).
                </li>
                <li>
                  <strong>Contas essenciais:</strong> a variação de preço de luz, água, gás e telecom não é simulada
                  (regimes próprios); elas entram no retrato pelo cashback — 100% da CBS + 20% do IBS embutidos.
                </li>
                <li>
                  <strong>Cashback das demais compras:</strong> aplicado sobre as categorias tributadas na alíquota
                  cheia (vestuário/casa e demais serviços), com os mínimos de 20% da LC 214/2025.
                </li>
                <li>
                  <strong>Curva por faixa de renda:</strong> perfis ilustrativos de famílias de 4 pessoas; nas faixas
                  elegíveis pela renda, assume-se inscrição no CadÚnico. A curva olha os tributos da cesta; as contas
                  essenciais entram só pelo cashback.
                </li>
              </ul>
            </Sanfona>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Três linhas divergentes: variação da cesta, cashback e o líquido. */
function ResumoLiquido({ linhas }: { linhas: { id: string; rotulo: string; valor: number; forte?: boolean }[] }) {
  const maxAbs = Math.max(...linhas.map((l) => Math.abs(l.valor)), 0.01)
  return (
    <div className="dbars">
      {linhas.map((l) => {
        const frac = Math.abs(l.valor) / maxAbs
        const sobe = l.valor > 0.005
        const desce = l.valor < -0.005
        return (
          <div className={`dbars-row${l.forte ? ' dbars-row-forte' : ''}`} key={l.id}>
            <span className="dbars-label">{l.rotulo}</span>
            <div className="dbars-track" aria-hidden>
              <span className="dbars-eixo" />
              {(sobe || desce) && (
                <span
                  className="dbars-fill"
                  style={{
                    width: `${(frac * 50).toFixed(2)}%`,
                    left: sobe ? '50%' : `${(50 - frac * 50).toFixed(2)}%`,
                    background: sobe ? 'var(--cor-icms)' : 'var(--cor-cbs)',
                  }}
                />
              )}
            </div>
            <span className={`dbars-valor mono${sobe ? ' sobe' : ''}${desce ? ' desce' : ''}`}>{brlAssinado(l.valor)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Linhas por faixa de renda: carga hoje, no pleno e depois do cashback. */
function CurvaProgressividade({ curva }: { curva: PontoProgressividade[] }) {
  const { ref, width } = useMeasure<HTMLDivElement>()
  const w = Math.max(width, 320)
  const h = 250
  const M = { topo: 14, dir: 14, base: 40, esq: 46 }
  const max = Math.max(...curva.flatMap((p) => [p.cargaHoje, p.cargaNova, p.cargaComCashback])) * 1.12
  const x = (i: number) => M.esq + ((w - M.esq - M.dir) * i) / (curva.length - 1)
  const y = (v: number) => M.topo + (h - M.topo - M.base) * (1 - v / (max || 1))

  const series = [
    { id: 'hoje', cor: CORES.icms, valores: curva.map((p) => p.cargaHoje) },
    { id: 'nova', cor: CORES.cbs, valores: curva.map((p) => p.cargaNova) },
    { id: 'cashback', cor: CORES.ibs, valores: curva.map((p) => p.cargaComCashback), tracejada: true },
  ]
  const caminho = (vs: number[]) => vs.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const gridY = [0.05, 0.1]

  return (
    <div ref={ref} className="chart-holder" style={{ height: h }}>
      <svg width={w} height={h} role="img" aria-label="Carga de tributos de consumo como fração da renda, por faixa de renda familiar — os valores exatos estão na vista de tabela">
        {gridY
          .filter((g) => g < max)
          .map((g) => (
            <g key={g}>
              <line x1={M.esq} x2={w - M.dir} y1={y(g)} y2={y(g)} className="grid-line" />
              <text x={M.esq - 8} y={y(g) + 4} textAnchor="end" className="axis-num">
                {pct(g, 0)}
              </text>
            </g>
          ))}
        <line x1={M.esq} x2={w - M.dir} y1={y(0)} y2={y(0)} className="grid-line" />
        {series.map((s) => (
          <path
            key={s.id}
            d={caminho(s.valores)}
            style={{ fill: 'none', stroke: s.cor, strokeWidth: 2 }}
            strokeDasharray={s.tracejada ? '5 4' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) =>
          s.valores.map((v, i) => (
            <circle key={`${s.id}-${i}`} cx={x(i)} cy={y(v)} r={3.5} style={{ fill: s.cor }} className="dot-ring" />
          )),
        )}
        {curva.map((p, i) => (
          <text
            key={p.faixa.id}
            x={x(i)}
            y={h - (i % 2 === 0 ? 22 : 8)}
            textAnchor="middle"
            className="axis-num"
          >
            {p.faixa.rotulo}
          </text>
        ))}
      </svg>
    </div>
  )
}
