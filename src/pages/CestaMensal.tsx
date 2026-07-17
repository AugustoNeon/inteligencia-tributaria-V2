import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CabecalhoPagina } from '../components/layout/Shell'
import { CompareBars } from '../components/charts/CompareBars'
import { VizPanel } from '../components/charts/VizPanel'
import { BotaoCompartilhar, BotaoPdf, Callout, Campo, EntradaNumero, RelatorioImpresso, Sanfona, Segmentado, StatTile, useCompartilharLink } from '../components/ui/kit'
import { CESTA_PADRAO, PERFIS_CESTA } from '../data/cesta'
import { ICMS_UF, UF_PADRAO } from '../data/icmsUf'
import { ANOS_SIMULAVEIS } from '../data/transicao'
import { cestaInicial, csvDaCesta, simularCesta, type LinhaCesta } from '../lib/cesta-mensal'
import { brl, pct, pctDelta } from '../lib/format'

/** −12,34 → "−R$ 12,34" · 12,34 → "+R$ 12,34" */
const brlAssinado = (v: number) => (v > 0 ? `+${brl(v)}` : brl(v))

export function CestaMensal() {
  const [params, setParams] = useSearchParams()

  const [itens, setItens] = useState(() =>
    cestaInicial().map((item) => {
      const v = Number(params.get(item.categoriaId))
      return Number.isFinite(v) && params.has(item.categoriaId) ? { ...item, valor: Math.max(v, 0) } : item
    }),
  )
  const [uf, setUf] = useState(() =>
    ICMS_UF.some((u) => u.uf === params.get('uf')) ? (params.get('uf') as string) : UF_PADRAO,
  )
  const [ano, setAno] = useState(() => {
    const a = Number(params.get('ano'))
    return ANOS_SIMULAVEIS.includes(a) ? a : 2033
  })
  const { copiado, compartilhar } = useCompartilharLink()

  const r = useMemo(() => simularCesta(itens, uf, ano), [itens, uf, ano])
  const orcamento = itens.reduce((s, i) => s + (Number.isFinite(i.valor) ? i.valor : 0), 0)
  const temCesta = r.hoje.precoFinal > 0

  const mudarItem = (categoriaId: string, valor: number) =>
    setItens((atual) => atual.map((i) => (i.categoriaId === categoriaId ? { ...i, valor } : i)))

  const aplicarPerfil = (id: string) => {
    const perfil = PERFIS_CESTA.find((p) => p.id === id)!
    setItens((atual) => atual.map((i) => ({ ...i, valor: perfil.valores[i.categoriaId] ?? 0 })))
  }

  const perfilAtivo = PERFIS_CESTA.find((p) => itens.every((i) => i.valor === (p.valores[i.categoriaId] ?? 0)))?.id

  const compartilharLink = () => {
    const q = new URLSearchParams({ uf, ano: String(ano) })
    for (const item of itens) q.set(item.categoriaId, String(item.valor))
    setParams(q, { replace: true })
    void compartilhar(`${location.origin}${location.pathname}#/cesta?${q.toString()}`)
  }

  const baixarCsv = () => {
    // BOM p/ o Excel pt-BR reconhecer o UTF-8
    const blob = new Blob(['\ufeff' + csvDaCesta(r, ano)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cesta-mensal-${uf}-${ano}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
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
        kicker="cesta://orcamento-mensal"
        titulo="O mês da sua família, sob dois sistemas"
        descricao="Distribua um orçamento mensal entre as categorias e veja o efeito agregado da reforma no seu custo de vida — hoje versus qualquer ano da transição, com as mesmas premissas da calculadora."
      />

      <div className="conteudo">
        <div className="calc-layout">
          <aside className="calc-form">
            <p className="form-titulo">Comece por um perfil</p>
            <div className="chips" role="group" aria-label="Perfis de orçamento">
              {PERFIS_CESTA.map((p) => (
                <button
                  key={p.id}
                  className={`chip${perfilAtivo === p.id ? ' on' : ''}`}
                  title={p.descricao}
                  onClick={() => aplicarPerfil(p.id)}
                >
                  {p.rotulo}
                </button>
              ))}
            </div>

            <p className="form-titulo">Gastos do mês</p>
            {itens.map((item) => {
              const padrao = CESTA_PADRAO.find((c) => c.categoriaId === item.categoriaId)!
              return (
                <Campo key={item.categoriaId} label={padrao.rotulo}>
                  <EntradaNumero valor={item.valor} onMudar={(v) => mudarItem(item.categoriaId, v)} min={0} passo={50} prefixo="R$" />
                </Campo>
              )
            })}

            <p className="cesta-total">
              Orçamento informado <strong className="mono">{brl(orcamento)}</strong>
            </p>

            <Campo label="Estado (ICMS dos produtos)">
              <select value={uf} onChange={(e) => setUf(e.target.value)}>
                {ICMS_UF.map((u) => (
                  <option key={u.uf} value={u.uf}>
                    {u.uf} — {u.nome} ({(u.aliquota * 100).toLocaleString('pt-BR')}%)
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Ano da simulação">
              <Segmentado
                ariaLabel="Ano da simulação"
                opcoes={ANOS_SIMULAVEIS.map((a) => ({ valor: a, rotulo: String(a) }))}
                valor={ano}
                onMudar={setAno}
              />
            </Campo>
          </aside>

          <div className="calc-resultado">
            {!temCesta ? (
              <div className="vazio">
                <p>
                  <strong>Informe pelo menos um gasto mensal</strong>
                </p>
                <p className="vazio-dica">Preencha os campos ao lado para simular a sua cesta.</p>
              </div>
            ) : (
              <>
                <RelatorioImpresso
                  titulo="Simulação da cesta mensal — o orçamento sob dois sistemas"
                  parametros={[
                    { rotulo: 'Orçamento mensal', valor: brl(orcamento) },
                    { rotulo: 'Estado', valor: uf },
                    { rotulo: 'Ano simulado', valor: String(ano) },
                  ]}
                />
                <div className="calc-share">
                  <BotaoPdf />
                  <button className="botao-acao" onClick={baixarCsv}>
                    Baixar CSV
                  </button>
                  <BotaoCompartilhar copiado={copiado} onCompartilhar={compartilharLink} />
                </div>

                <div className="calc-tiles">
                  <StatTile
                    label={`Custo da cesta em ${ano}`}
                    valor={brl(r.novo.precoFinal)}
                    contexto={`${pctDelta(r.deltaMensal / r.hoje.precoFinal)} vs. hoje`}
                    tom={r.deltaMensal > 0.01 ? 'antigo' : 'novo'}
                  />
                  <StatTile
                    label="Impostos dentro do mês"
                    valor={`${pct(r.hoje.carga)} → ${pct(r.novo.carga)}`}
                    contexto={`${brl(r.hoje.totalImpostos)} → ${brl(r.novo.totalImpostos)}`}
                  />
                  <StatTile
                    label="Efeito em 12 meses"
                    valor={brlAssinado(r.deltaAnual)}
                    contexto="mantendo esta cesta o ano todo"
                    tom={r.deltaAnual > 0.12 ? 'antigo' : 'novo'}
                  />
                </div>

                <VizPanel
                  titulo="A cesta inteira, dois sistemas"
                  subtitulo="Comprimento da barra = custo do mês; segmentos = para onde vai cada real"
                  legenda={legenda}
                  tabela={{
                    colunas: ['Cenário', 'Custo do mês', 'Sem tributos', ...legenda.slice(1).map((l) => l.rotulo), 'Carga'],
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
                  titulo="Quem puxa a conta para cima, quem alivia"
                  subtitulo={`Diferença mensal por categoria em ${ano} — cobre = fica mais caro, petróleo = fica mais barato`}
                  tabela={{
                    colunas: ['Categoria', 'Hoje', `Em ${ano}`, 'Diferença/mês'],
                    linhas: [...r.linhas]
                      .sort((a, b) => b.delta - a.delta)
                      .map((l) => [l.rotulo, brl(l.hoje), brl(l.novo), brlAssinado(l.delta)]),
                  }}
                  criancas={<DeltaBars linhas={r.linhas} />}
                />

                {r.novo.anoTeste && (
                  <Callout tom="info" titulo="2026 é ano-teste">
                    CBS e IBS aparecem destacados em nota, mas são compensáveis — a carga da sua cesta não muda neste
                    ano.
                  </Callout>
                )}

                <Sanfona titulo="Como calculamos (todas as premissas)">
                  <ul>
                    <li>
                      <strong>Item a item:</strong> cada categoria da cesta usa o mesmo motor da calculadora
                      comparativa — tributos "por dentro" hoje, CBS/IBS "por fora" no novo sistema, com a redução legal
                      da categoria (cesta básica 100%, saúde/educação/medicamentos 60%, etc.).
                    </li>
                    <li>
                      <strong>ICMS:</strong> os itens de comércio usam a alíquota modal do estado escolhido; serviços
                      usam ISS típico da categoria.
                    </li>
                    <li>
                      <strong>Repasse integral:</strong> premissa de que o vendedor repassa toda a diferença de imposto
                      ao preço — o preço sem tributos não muda.
                    </li>
                    <li>
                      <strong>Fora do modelo:</strong> créditos da cadeia, Simples Nacional, Imposto Seletivo, cashback
                      (simulável na página própria) e disputas de repasse. Estimativa didática, não previsão de preço.
                    </li>
                  </ul>
                </Sanfona>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Barras divergentes: diferença mensal por categoria (cobre sobe, petróleo desce). */
function DeltaBars({ linhas }: { linhas: LinhaCesta[] }) {
  const ordenadas = [...linhas].sort((a, b) => b.delta - a.delta)
  const maxAbs = Math.max(...linhas.map((l) => Math.abs(l.delta)), 0.01)

  return (
    <div className="dbars">
      {ordenadas.map((l) => {
        const frac = Math.abs(l.delta) / maxAbs
        const sobe = l.delta > 0.005
        const desce = l.delta < -0.005
        return (
          <div className="dbars-row" key={l.categoriaId}>
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
            <span className={`dbars-valor mono${sobe ? ' sobe' : ''}${desce ? ' desce' : ''}`}>
              {brlAssinado(l.delta)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
