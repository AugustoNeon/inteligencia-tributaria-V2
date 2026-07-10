import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CabecalhoPagina } from '../components/layout/Shell'
import { StackedArea } from '../components/charts/StackedArea'
import { VizPanel } from '../components/charts/VizPanel'
import { Selo } from '../components/ui/kit'
import { CORES } from '../data/tributos'
import { EPILOGO_2078, TRANSICAO } from '../data/transicao'

const FASES: Record<string, { rotulo: string; tom: 'neutro' | 'novo' | 'antigo' | 'destaque' }> = {
  preparacao: { rotulo: 'preparação', tom: 'neutro' },
  teste: { rotulo: 'ano-teste', tom: 'destaque' },
  federal: { rotulo: 'virada federal', tom: 'novo' },
  'estadual-municipal': { rotulo: 'transição ICMS/ISS', tom: 'antigo' },
  pleno: { rotulo: 'sistema pleno', tom: 'novo' },
}

export function LinhaDoTempo() {
  const [params, setParams] = useSearchParams()
  const anoParam = Number(params.get('ano'))
  const idxInicial = Math.max(
    TRANSICAO.findIndex((t) => t.ano === anoParam),
    TRANSICAO.findIndex((t) => t.ano === 2026),
  )
  const [idx, setIdx] = useState(idxInicial)
  const ano = TRANSICAO[idx]

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
  }

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="timeline://2023-2033"
        titulo="Dez anos para trocar o motor em pleno voo"
        descricao="A reforma não liga uma chave: ela desliga um sistema e liga outro, ano a ano, entre 2026 e 2033 — com um epílogo federativo que vai até 2078. Selecione um ano no trilho ou no gráfico."
      />

      <div className="conteudo">
        <section className="secao">
          <div className="trilho" role="tablist" aria-label="Anos da transição">
            {TRANSICAO.map((t, i) => (
              <button
                key={t.ano}
                role="tab"
                aria-selected={i === idx}
                className={`trilho-ano${i === idx ? ' on' : ''} trilho-${t.fase}`}
                onClick={() => selecionar(i)}
              >
                <span className="mono">{t.ano}</span>
              </button>
            ))}
          </div>

          <article className="ano-painel" key={ano.ano}>
            <header className="ano-cab">
              <h2>
                <span className="ano-num mono">{ano.ano}</span> {ano.titulo}
              </h2>
              <Selo tom={FASES[ano.fase].tom}>{FASES[ano.fase].rotulo}</Selo>
            </header>
            <p className="ano-resumo">{ano.resumo}</p>
            <ul className="ano-detalhes">
              {ano.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </article>
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
