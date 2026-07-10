import { useMemo, useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { Donut } from '../components/charts/Donut'
import { VizPanel } from '../components/charts/VizPanel'
import { Callout, Campo, EntradaNumero, Sanfona, Segmentado, StatTile } from '../components/ui/kit'
import { CALENDARIO_CASHBACK, ESSENCIAIS, NOTAS_CASHBACK, REQUISITOS, SALARIO_MINIMO_PADRAO } from '../data/cashback'
import { calcularCashback } from '../lib/cashback'
import { brl, pct } from '../lib/format'

const CORES_DONUT = ['#0080a4', '#3cb5cd', '#6a51b8', '#c2622a', '#e09257', '#943310']

export function Cashback() {
  const [pessoas, setPessoas] = useState(4)
  const [renda, setRenda] = useState(2800)
  const [cadunico, setCadunico] = useState<'sim' | 'nao'>('sim')
  const [salarioMinimo, setSalarioMinimo] = useState(SALARIO_MINIMO_PADRAO)
  const [gastos, setGastos] = useState<Record<string, number>>({
    energia: 180,
    agua: 90,
    'gas-encanado': 0,
    botijao: 110,
    telecom: 120,
  })
  const [demais, setDemais] = useState(600)

  const r = useMemo(
    () =>
      calcularCashback({
        pessoas,
        rendaFamiliar: renda,
        inscritoCadUnico: cadunico === 'sim',
        salarioMinimo,
        gastos,
        demaisCompras: demais,
      }),
    [pessoas, renda, cadunico, salarioMinimo, gastos, demais],
  )

  const fatias = r.linhas
    .filter((l) => l.devolucao > 0)
    .map((l, i) => ({ id: l.id, rotulo: l.rotulo, valor: l.devolucao, cor: CORES_DONUT[i % CORES_DONUT.length] }))

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="cashback://lc-214.cadunico"
        titulo="O imposto que volta"
        descricao="Pela primeira vez, a Constituição garante devolução de imposto para famílias de baixa renda: 100% da CBS e ao menos 20% do IBS nas contas essenciais. Simule a devolução de uma família no sistema pleno (2033)."
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

            <h2 className="form-titulo">Gastos mensais</h2>
            {ESSENCIAIS.map((c) => (
              <Campo key={c.id} label={c.rotulo} dica={c.dica}>
                <EntradaNumero
                  valor={gastos[c.id] ?? 0}
                  onMudar={(v) => setGastos((g) => ({ ...g, [c.id]: v }))}
                  min={0}
                  passo={10}
                  prefixo="R$"
                />
              </Campo>
            ))}
            <Campo label="Demais compras tributadas" dica="Fora cesta básica (alíquota zero não gera devolução)">
              <EntradaNumero valor={demais} onMudar={setDemais} min={0} passo={50} prefixo="R$" />
            </Campo>

            <Sanfona titulo="Parâmetro: salário mínimo">
              <Campo label="Salário mínimo vigente" dica="Usado no teste de renda (meio salário por pessoa). Edite se estiver desatualizado.">
                <EntradaNumero valor={salarioMinimo} onMudar={setSalarioMinimo} min={0} passo={10} prefixo="R$" />
              </Campo>
            </Sanfona>
          </aside>

          <div className="calc-resultado">
            <div className={`elegibilidade ${r.elegivel ? 'ok' : 'nao'}`} role="status">
              {r.elegivel ? (
                <>
                  <strong>Família elegível.</strong> Renda por pessoa de {brl(r.rendaPerCapita)} — dentro do limite de{' '}
                  {brl(r.limite)} (meio salário mínimo).
                </>
              ) : cadunico === 'nao' ? (
                <>
                  <strong>Sem elegibilidade:</strong> a devolução exige inscrição no CadÚnico. Os valores abaixo mostram
                  o que uma família elegível com esses gastos receberia.
                </>
              ) : (
                <>
                  <strong>Renda acima do limite:</strong> {brl(r.rendaPerCapita)} por pessoa contra um teto de{' '}
                  {brl(r.limite)}. Os valores abaixo mostram o que uma família elegível com esses gastos receberia.
                </>
              )}
            </div>

            <div className="calc-tiles">
              <StatTile label="Devolução mensal estimada" valor={brl(r.elegivel ? r.totalMensal : r.linhas.reduce((s, l) => s + l.devolucao, 0))} tom="novo" />
              <StatTile label="Em um ano" valor={brl((r.elegivel ? r.totalMensal : r.linhas.reduce((s, l) => s + l.devolucao, 0)) * 12)} contexto="dinheiro de volta no CPF" />
              <StatTile
                label="Imposto embutido nos gastos"
                valor={brl(r.impostoEmbutidoTotal)}
                contexto="CBS + IBS pagos por mês na alíquota padrão"
              />
            </div>

            <VizPanel
              titulo="De onde vem a devolução"
              subtitulo="Cada categoria devolve uma fração diferente do imposto embutido"
              tabela={{
                colunas: ['Categoria', 'Gasto', 'CBS embutida', 'IBS embutido', 'Regra', 'Devolução'],
                linhas: r.linhas.map((l) => [l.rotulo, brl(l.gasto), brl(l.cbsEmbutida), brl(l.ibsEmbutido), l.regra, brl(l.devolucao)]),
              }}
              legenda={fatias.map((f) => ({ id: f.id, rotulo: f.rotulo, cor: f.cor }))}
              criancas={
                <Donut
                  fatias={fatias}
                  centro={brl(r.linhas.reduce((s, l) => s + l.devolucao, 0))}
                  centroRotulo="por mês"
                  formatar={brl}
                />
              }
              notaRodape="Percentuais mínimos nacionais da LC 214/2025; estados e municípios podem devolver mais IBS."
            />

            <section className="regras-grade">
              <div>
                <h3>Quem tem direito</h3>
                <ul className="lista-limpa">
                  {REQUISITOS.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Quando começa</h3>
                <ul className="lista-limpa">
                  {CALENDARIO_CASHBACK.map((c) => (
                    <li key={c.ano}>
                      <span className="mono">{c.ano}</span> — {c.evento}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <Callout tom="info" titulo="Bom saber">
              <ul>
                {NOTAS_CASHBACK.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Callout>

            <Sanfona titulo="Como calculamos">
              <ul>
                <li>
                  Premissa: preços informados já embutem CBS + IBS na alíquota padrão de referência (26,5% por fora ={' '}
                  {pct(0.265 / 1.265)} do preço).
                </li>
                <li>Contas essenciais: devolução de 100% da CBS + 20% do IBS embutidos (mínimos da LC 214/2025).</li>
                <li>Demais compras: 20% da CBS + 20% do IBS.</li>
                <li>Cenário do sistema pleno (2033). Entre 2027 e 2032 a devolução acompanha a transição.</li>
              </ul>
            </Sanfona>
          </div>
        </div>
      </div>
    </div>
  )
}
