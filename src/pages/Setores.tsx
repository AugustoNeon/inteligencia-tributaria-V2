import { useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { Slope } from '../components/charts/Slope'
import { VizPanel } from '../components/charts/VizPanel'
import { Callout } from '../components/ui/kit'
import { NOTA_SETORES, SETORES } from '../data/setores'
import { pct, pctDelta } from '../lib/format'
import { CORES } from '../data/tributos'

/** cor por direção do impacto: sobe = cobre (mais carga), cai = petróleo */
const corDoSetor = (hoje: number, novo: number) => (novo > hoje + 0.005 ? CORES.icms : novo < hoje - 0.005 ? CORES.cbs : CORES.is)

export function Setores() {
  const [ativo, setAtivo] = useState<string | null>(null)

  const linhas = SETORES.map((s) => ({
    id: s.id,
    rotulo: s.nome,
    de: s.hoje,
    para: s.novo,
    cor: corDoSetor(s.hoje, s.novo),
  }))

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="setores://hoje-vs-pleno"
        titulo="Quem paga mais, quem paga menos"
        descricao="A reforma redistribui a carga: o que a indústria deixa de pagar em cascata, os serviços passam a pagar em alíquota — com amortecedores para saúde, educação, agro e cesta básica. Passe o mouse sobre as linhas."
      />

      <div className="conteudo">
        <section className="secao">
          <VizPanel
            titulo="Carga tributária estimada sobre o preço final"
            subtitulo="Cobre = tende a subir · Petróleo = tende a cair · Violeta = estável"
            tabela={{
              colunas: ['Setor', 'Hoje', 'Sistema pleno (2033)', 'Variação'],
              linhas: SETORES.map((s) => [s.nome, pct(s.hoje), pct(s.novo), pctDelta(s.novo - s.hoje)]),
            }}
            criancas={
              <Slope
                linhas={linhas}
                rotuloDe="Hoje"
                rotuloPara="Sistema pleno (2033)"
                altura={400}
                ativo={ativo}
                onHover={setAtivo}
              />
            }
            notaRodape={NOTA_SETORES}
          />
        </section>

        <section className="secao">
          <h2>Leitura por setor</h2>
          <div className="setores-lista">
            {SETORES.map((s) => (
              <article
                key={s.id}
                className={`setor-item${ativo === s.id ? ' on' : ''}`}
                onMouseEnter={() => setAtivo(s.id)}
                onMouseLeave={() => setAtivo(null)}
              >
                <header>
                  <h3>{s.nome}</h3>
                  <span className="setor-delta mono" style={{ color: corDoSetor(s.hoje, s.novo) }}>
                    {pct(s.hoje)} → {pct(s.novo)}
                  </span>
                </header>
                <p>{s.leitura}</p>
                <p className="setor-premissa">{s.premissa}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="secao">
          <Callout tom="atencao" titulo="Estimativas, não sentenças">
            Os números assumem repasse integral e contribuinte no regime regular. Na prática, créditos na cadeia,
            contratos, concorrência e o Simples mudam o resultado de cada empresa. Use a{' '}
            <a href="#/calculadora">calculadora</a> para o seu caso e confirme com um contador.
          </Callout>
        </section>
      </div>
    </div>
  )
}
