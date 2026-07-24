import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CabecalhoPagina } from '../components/layout/Shell'
import { StackedArea } from '../components/charts/StackedArea'
import { VizPanel } from '../components/charts/VizPanel'
import { Selo, SourceLink, StatTile } from '../components/ui/kit'
import { CORES } from '../data/tributos'
import { EPILOGO_2078, TRANSICAO, type AnoTransicao } from '../data/transicao'
import { fonte } from '../data/fontes'
import { anoDaTransicao, dataLonga, progressoTransicao, proximoMarco } from '../lib/agora'
import { pct } from '../lib/format'

const FASES: Record<string, { rotulo: string; tom: 'neutro' | 'novo' | 'antigo' | 'destaque' }> = {
  preparacao: { rotulo: 'preparação', tom: 'neutro' },
  teste: { rotulo: 'ano-teste', tom: 'destaque' },
  federal: { rotulo: 'virada federal', tom: 'novo' },
  'estadual-municipal': { rotulo: 'transição ICMS/ISS', tom: 'antigo' },
  pleno: { rotulo: 'sistema pleno', tom: 'novo' },
}

/** cor do ponto de cada grupo de fase no índice — mesma codificação semântica do projeto */
const FASE_COR: Record<string, string> = {
  preparacao: 'var(--line-forte)',
  teste: 'var(--cor-is)',
  federal: 'var(--cor-cbs)',
  'estadual-municipal': 'var(--cor-icms)',
  pleno: 'var(--cor-ibs)',
}

export function LinhaDoTempo() {
  const [params, setParams] = useSearchParams()
  const hoje = useMemo(() => new Date(), [])
  const anoHoje = anoDaTransicao(hoje)
  const anoParam = Number(params.get('ano'))
  // sem ?ano na URL, a página abre no ano em que estamos de verdade
  const idxInicial = Math.max(
    TRANSICAO.findIndex((t) => t.ano === anoParam),
    TRANSICAO.findIndex((t) => t.ano === anoHoje),
  )
  const [idx, setIdx] = useState(idxInicial)
  const ano = TRANSICAO[idx]
  const marco = proximoMarco(hoje)
  const progresso = progressoTransicao(hoje)
  const antigoPct = ano.composicao.federaisAntigos + ano.composicao.icms + ano.composicao.iss
  const novoPct = ano.composicao.cbs + ano.composicao.ibs + ano.composicao.is

  // anos consecutivos da mesma fase viram um grupo recolhível no índice
  const gruposFase = useMemo(() => {
    const grupos: { fase: AnoTransicao['fase']; anos: AnoTransicao[] }[] = []
    TRANSICAO.forEach((t) => {
      const ultimo = grupos[grupos.length - 1]
      if (ultimo && ultimo.fase === t.fase) ultimo.anos.push(t)
      else grupos.push({ fase: t.fase, anos: [t] })
    })
    return grupos
  }, [])

  // só o grupo do ano inicial abre sozinho; os demais ficam recolhidos
  const [gruposAbertos, setGruposAbertos] = useState<Set<AnoTransicao['fase']>>(
    () => new Set([TRANSICAO[idxInicial].fase]),
  )
  const alternarGrupo = (fase: AnoTransicao['fase']) => {
    setGruposAbertos((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(fase)) proximo.delete(fase)
      else proximo.add(fase)
      return proximo
    })
  }

  const series = useMemo(
    () => [
      { id: 'federaisAntigos', rotulo: 'PIS/Cofins/IPI', cor: CORES.federaisAntigos, valores: TRANSICAO.map((t) => t.composicao.federaisAntigos) },
      { id: 'icms', rotulo: 'ICMS', cor: CORES.icms, valores: TRANSICAO.map((t) => t.composicao.icms) },
      { id: 'iss', rotulo: 'ISS', cor: CORES.iss, valores: TRANSICAO.map((t) => t.composicao.iss) },
      { id: 'cbs', rotulo: 'CBS', cor: CORES.cbs, valores: TRANSICAO.map((t) => t.composicao.cbs) },
      { id: 'ibs', rotulo: 'IBS', cor: CORES.ibs, valores: TRANSICAO.map((t) => t.composicao.ibs) },
      { id: 'is', rotulo: 'IS', cor: CORES.is, valores: TRANSICAO.map((t) => t.composicao.is) },
    ],
    [],
  )

  const selecionar = (i: number) => {
    setIdx(i)
    setParams({ ano: String(TRANSICAO[i].ano) }, { replace: true })
    // garante que o grupo do ano escolhido esteja aberto (ex.: clique vindo do gráfico)
    setGruposAbertos((prev) => new Set(prev).add(TRANSICAO[i].fase))
  }

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="timeline://2023-2033"
        titulo="Dez anos para trocar o motor em pleno voo"
        descricao="A reforma não liga uma chave: ela desliga um sistema e liga outro, ano a ano, entre 2026 e 2033 — com um epílogo federativo que vai até 2078. Selecione um ano no índice ao lado ou no gráfico."
      />

      <div className="conteudo">
        <section className="secao">
          <div className="agora" role="group" aria-label="Posição de hoje na transição">
            <div className="agora-texto">
              <p className="agora-titulo">
                <span className="agora-pulso" aria-hidden />
                Você está aqui: <strong>{dataLonga(hoje)}</strong>
              </p>
              <p className="agora-detalhe">
                {marco ? (
                  <>
                    Faltam <strong className="mono">{marco.dias.toLocaleString('pt-BR')} dias</strong> para{' '}
                    {marco.marco.rotulo} (1º de janeiro de {marco.marco.ano}).
                  </>
                ) : (
                  <>O sistema pleno já está em vigor — segue apenas a transição federativa, até 2078.</>
                )}
              </p>
            </div>
            <div className="agora-progresso">
              <div
                className="agora-barra"
                role="progressbar"
                aria-valuenow={Math.round(progresso * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Percentual da transição percorrido"
              >
                <div className="agora-barra-fill" style={{ width: `${(progresso * 100).toFixed(1)}%` }} />
              </div>
              <p className="agora-legenda">
                <span className="mono">{pct(progresso, 0)}</span> da transição percorrida · EC 132 (20/12/2023) →
                sistema pleno (1º/01/2033)
              </p>
            </div>
          </div>

          <div className="transicao-grid">
            <nav className="transicao-indice" aria-label="Anos da transição">
              {gruposFase.map((g) => {
                const aberto = gruposAbertos.has(g.fase)
                const intervalo =
                  g.anos.length > 1 ? `${g.anos[0].ano}–${g.anos[g.anos.length - 1].ano}` : String(g.anos[0].ano)
                return (
                  <div className="indice-grupo" key={g.fase}>
                    <button className="indice-grupo-cab" aria-expanded={aberto} onClick={() => alternarGrupo(g.fase)}>
                      <svg
                        className={`indice-chevron${aberto ? ' aberto' : ''}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="indice-grupo-dot" style={{ background: FASE_COR[g.fase] }} aria-hidden />
                      <span className="indice-grupo-nome">{FASES[g.fase].rotulo}</span>
                      <span className="indice-grupo-intervalo mono">{intervalo}</span>
                    </button>
                    <div className={`indice-corpo-wrap${aberto ? ' aberto' : ''}`}>
                      <div className="indice-corpo">
                        <div className="indice-corpo-inner" role="tablist" aria-label={FASES[g.fase].rotulo}>
                          {g.anos.map((t) => {
                            const i = TRANSICAO.indexOf(t)
                            return (
                              <button
                                key={t.ano}
                                role="tab"
                                aria-selected={i === idx}
                                aria-label={t.ano === anoHoje ? `${t.ano} (ano atual)` : String(t.ano)}
                                className={`indice-ano mono${i === idx ? ' on' : ''}`}
                                onClick={() => selecionar(i)}
                              >
                                <span>{t.ano}</span>
                                {t.ano === anoHoje && <span className="indice-hoje-tag">hoje</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </nav>

            <article className="transicao-conteudo" key={ano.ano}>
              <header className="ano-cab">
                <h2>
                  <span className="ano-num mono">{ano.ano}</span> {ano.titulo}
                </h2>
                <Selo tom={FASES[ano.fase].tom}>{FASES[ano.fase].rotulo}</Selo>
              </header>
              <p className="ano-resumo">{ano.resumo}</p>

              <div className="conteudo-stats">
                <StatTile
                  label="Ainda no sistema antigo"
                  valor={pct(antigoPct / 100, 0)}
                  contexto="PIS/Cofins/IPI + ICMS + ISS"
                  tom="antigo"
                />
                <StatTile
                  label="Já no sistema novo"
                  valor={pct(novoPct / 100, 0)}
                  contexto="CBS + IBS + Imposto Seletivo"
                  tom="novo"
                />
              </div>

              <ul className="ano-detalhes">
                {ano.detalhes.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>

              {ano.fonteId && (
                <div className="conteudo-fonte">
                  <SourceLink fonte={fonte(ano.fonteId)} />
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="secao">
          <VizPanel
            titulo="A troca de sistema, visualizada"
            subtitulo="Participação ilustrativa de cada tributo na arrecadação sobre o consumo — clique para trocar o ano"
            legenda={series.map((s) => ({ id: s.id, rotulo: s.rotulo, cor: s.cor }))}
            tabela={{
              colunas: ['Ano', ...series.map((s) => s.rotulo)],
              linhas: TRANSICAO.map((t, i) => [t.ano, ...series.map((s) => `${s.valores[i].toLocaleString('pt-BR')}%`)]),
            }}
            notaRodape="Premissa didática de receita constante; as participações reais dependem das alíquotas fixadas pelo Senado."
            criancas={
              <StackedArea
                xRotulos={TRANSICAO.map((t) => t.ano)}
                series={series}
                altura={340}
                selecionado={idx}
                onSelecionar={selecionar}
              />
            }
          />
        </section>

        <section className="secao">
          <article className="epilogo">
            <p className="epilogo-ano mono">{EPILOGO_2078.ano}</p>
            <div>
              <h2>{EPILOGO_2078.titulo}</h2>
              <p className="secao-desc">{EPILOGO_2078.resumo}</p>
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}
