import { Link } from 'react-router-dom'
import { StackedArea } from '../components/charts/StackedArea'
import { VizPanel } from '../components/charts/VizPanel'
import { SourceLink } from '../components/ui/kit'
import { CORES } from '../data/tributos'
import { TRANSICAO } from '../data/transicao'
import { fonte } from '../data/fontes'

/** Diagrama 5 → 3: os tributos antigos desaguando nos novos. */
function DiagramaFusao() {
  const antigos = [
    { sigla: 'PIS', y: 26 },
    { sigla: 'Cofins', y: 84 },
    { sigla: 'IPI', y: 142 },
    { sigla: 'ICMS', y: 200 },
    { sigla: 'ISS', y: 258 },
  ]
  const novos = [
    { sigla: 'CBS', nome: 'IVA federal', y: 55, cor: CORES.cbs },
    { sigla: 'IBS', nome: 'IVA estados + municípios', y: 229, cor: CORES.ibs },
    { sigla: 'IS', nome: 'Imposto Seletivo', y: 142, cor: CORES.is },
  ]
  // pares origem → destino
  const fluxos: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 2],
    [3, 1],
    [4, 1],
  ]
  const curva = (y0: number, y1: number) => `M118,${y0 + 14} C 190,${y0 + 14} 190,${y1 + 14} 262,${y1 + 14}`

  return (
    <svg viewBox="0 0 380 290" className="fusao" role="img" aria-label="Cinco tributos atuais (PIS, Cofins, IPI, ICMS e ISS) são substituídos por três: CBS, IBS e Imposto Seletivo">
      {fluxos.map(([de, para], i) => (
        <path key={i} d={curva(antigos[de].y, novos[para].y)} className="fusao-fluxo" style={{ animationDelay: `${0.4 + i * 0.12}s` }} />
      ))}
      {antigos.map((t, i) => (
        <g key={t.sigla} className="fusao-chip" style={{ animationDelay: `${i * 0.09}s` }}>
          <rect x={8} y={t.y} width={110} height={28} rx={7} className="fusao-antigo" />
          <text x={63} y={t.y + 19} textAnchor="middle" className="fusao-sigla-antiga">
            {t.sigla}
          </text>
        </g>
      ))}
      {novos.map((t, i) => (
        <g key={t.sigla} className="fusao-chip" style={{ animationDelay: `${0.9 + i * 0.12}s` }}>
          <rect x={262} y={t.y} width={110} height={28} rx={7} style={{ fill: t.cor }} />
          <text x={317} y={t.y + 19} textAnchor="middle" className="fusao-sigla-nova">
            {t.sigla}
          </text>
          <text x={317} y={t.y + 44} textAnchor="middle" className="fusao-nome">
            {t.nome}
          </text>
        </g>
      ))}
    </svg>
  )
}

const FERRAMENTAS = [
  {
    para: '/guia',
    titulo: 'Guia da reforma',
    desc: 'O que muda, por que muda e onde está escrito — com as leis anexadas.',
  },
  {
    para: '/linha-do-tempo',
    titulo: 'Linha do tempo 2023 → 2033',
    desc: 'A transição ano a ano, com o gráfico da extinção do sistema antigo.',
  },
  {
    para: '/calculadora',
    titulo: 'Calculadora comparativa',
    desc: 'Quanto custa hoje × quanto custará: simule produtos e serviços em qualquer ano.',
  },
  {
    para: '/cashback',
    titulo: 'Simulador de cashback',
    desc: 'A devolução de imposto para famílias do CadÚnico, conta por conta.',
  },
  {
    para: '/setores',
    titulo: 'Impacto por setor',
    desc: 'Quem tende a pagar mais, quem tende a pagar menos — e por quê.',
  },
  {
    para: '/glossario',
    titulo: 'Glossário e fontes',
    desc: 'Do split payment ao nanoempreendedor, tudo pesquisável e referenciado.',
  },
]

export function Home() {
  const series = [
    { id: 'federaisAntigos', rotulo: 'PIS/Cofins/IPI', cor: CORES.federaisAntigos, valores: TRANSICAO.map((t) => t.composicao.federaisAntigos) },
    { id: 'icms', rotulo: 'ICMS', cor: CORES.icms, valores: TRANSICAO.map((t) => t.composicao.icms) },
    { id: 'iss', rotulo: 'ISS', cor: CORES.iss, valores: TRANSICAO.map((t) => t.composicao.iss) },
    { id: 'cbs', rotulo: 'CBS', cor: CORES.cbs, valores: TRANSICAO.map((t) => t.composicao.cbs) },
    { id: 'ibs', rotulo: 'IBS', cor: CORES.ibs, valores: TRANSICAO.map((t) => t.composicao.ibs) },
    { id: 'is', rotulo: 'IS', cor: CORES.is, valores: TRANSICAO.map((t) => t.composicao.is) },
  ]

  return (
    <div className="page-enter">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-texto">
            <h1>
              O maior redesenho de impostos do Brasil em 60 anos, <em>decodificado</em>.
            </h1>
            <p className="hero-sub">
              Cinco tributos sobre o consumo dão lugar a um IVA dual e um Imposto Seletivo entre 2026 e 2033.
              Este atlas interativo mostra <strong>o que muda, quando muda e quanto custa</strong> — com simuladores,
              gráficos e as fontes oficiais anexadas.
            </p>
            <div className="hero-acoes">
              <Link className="botao botao-claro" to="/calculadora">
                Simular um preço
              </Link>
              <Link className="botao botao-vazado" to="/guia">
                Entender a reforma
              </Link>
            </div>
          </div>
          <DiagramaFusao />
        </div>
      </section>

      <div className="conteudo">
        <section className="secao faixa-fatos">
          <dl className="fatos">
            <div>
              <dt>Alíquota de referência estimada</dt>
              <dd>
                <span className="mono">26,5%</span>
                <small>CBS 8,8% + IBS 17,7%, com trava legal</small>
              </dd>
            </div>
            <div>
              <dt>Transição para empresas</dt>
              <dd>
                <span className="mono">2026 → 2033</span>
                <small>oito anos, fase a fase</small>
              </dd>
            </div>
            <div>
              <dt>Cashback para baixa renda</dt>
              <dd>
                <span className="mono">100%</span>
                <small>da CBS em energia, água, gás e telecom</small>
              </dd>
            </div>
            <div>
              <dt>Cesta Básica Nacional</dt>
              <dd>
                <span className="mono">0%</span>
                <small>alíquota zero em todo o país</small>
              </dd>
            </div>
          </dl>
        </section>

        <section className="secao">
          <h2>Explore</h2>
          <div className="ferramentas">
            {FERRAMENTAS.map((f) => (
              <Link key={f.para} to={f.para} className="ferramenta">
                <span className="ferramenta-titulo">{f.titulo}</span>
                <span className="ferramenta-desc">{f.desc}</span>
                <span className="ferramenta-seta" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="secao">
          <h2>A extinção em câmera lenta</h2>
          <p className="secao-desc">
            A cada ano da transição, a família ferrugem (tributos antigos) perde espaço para a família petróleo
            (o novo IVA dual). Passe o mouse para inspecionar; clique em um ano para abrir na linha do tempo.
          </p>
          <VizPanel
            titulo="Composição da tributação do consumo, 2023–2033"
            subtitulo="Participação ilustrativa de cada tributo, assumindo substituição com receita constante"
            legenda={series.map((s) => ({ id: s.id, rotulo: s.rotulo, cor: s.cor }))}
            tabela={{
              colunas: ['Ano', ...series.map((s) => s.rotulo)],
              linhas: TRANSICAO.map((t, i) => [t.ano, ...series.map((s) => `${s.valores[i].toLocaleString('pt-BR')}%`)]),
            }}
            notaRodape="Ilustração didática — as participações reais dependem das alíquotas de referência fixadas pelo Senado."
            criancas={<AreaComNavegacao series={series} />}
          />
        </section>

        <section className="secao">
          <h2>Direto da fonte</h2>
          <p className="secao-desc">Tudo o que este site afirma aponta para o texto legal. Comece pelos três pilares:</p>
          <div className="fontes-grade">
            <SourceLink fonte={fonte('ec-132')} />
            <SourceLink fonte={fonte('lc-214')} />
            <SourceLink fonte={fonte('plp-108')} />
          </div>
        </section>
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import type { SerieArea } from '../components/charts/StackedArea'

function AreaComNavegacao({ series }: { series: SerieArea[] }) {
  const navegar = useNavigate()
  return (
    <StackedArea
      xRotulos={TRANSICAO.map((t) => t.ano)}
      series={series}
      altura={300}
      onSelecionar={(i) => navegar(`/linha-do-tempo?ano=${TRANSICAO[i].ano}`)}
    />
  )
}
