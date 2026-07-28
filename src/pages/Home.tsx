import { Link } from 'react-router-dom'
import { StackedArea } from '../components/charts/StackedArea'
import { VizPanel } from '../components/charts/VizPanel'
import { Glifo, type TipoGlifo } from '../components/ui/Glifo'
import { Selo, SourceLink } from '../components/ui/kit'
import { CORES } from '../data/tributos'
import { NOVIDADES, RADAR_VERIFICADO_EM } from '../data/novidades'
import { TRANSICAO } from '../data/transicao'
import { fonte } from '../data/fontes'

/**
 * Diagrama 5 → 3 com fluxo vivo: os tributos antigos desaguando nos novos.
 * Três codificações num desenho só:
 *  - espessura do canal ≈ participação na arrecadação do sistema pleno
 *    (mesma composição ilustrativa do gráfico da transição);
 *  - gradiente cobre → cor do destino = o sistema antigo se convertendo no novo;
 *  - pulsos contínuos = o fluxo não para depois da entrada.
 */
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
  // origem → destino; peso ≈ fatia da arrecadação em 2033 (composicao da transição)
  const fluxos = [
    { de: 0, para: 0, peso: 19 },
    { de: 1, para: 0, peso: 19 },
    { de: 2, para: 2, peso: 2 },
    { de: 3, para: 1, peso: 44 },
    { de: 4, para: 1, peso: 16 },
  ]
  const curva = (y0: number, y1: number) => `M118,${y0 + 14} C 190,${y0 + 14} 190,${y1 + 14} 262,${y1 + 14}`
  const largura = (peso: number) => 1.5 + peso * 0.09

  return (
    <svg viewBox="0 0 380 290" className="fusao" role="img" aria-label="Cinco tributos atuais (PIS, Cofins, IPI, ICMS e ISS) são substituídos por três: CBS, IBS e Imposto Seletivo — a espessura de cada canal indica a fatia da arrecadação">
      <defs>
        {fluxos.map((f, i) => (
          <linearGradient key={i} id={`fusao-grad-${i}`} gradientUnits="userSpaceOnUse" x1="118" y1="0" x2="262" y2="0">
            <stop offset="0" className="fusao-grad-origem" />
            <stop offset="1" style={{ stopColor: novos[f.para].cor }} />
          </linearGradient>
        ))}
      </defs>

      {/* canais: gradiente cobre → destino, espessura pela fatia da arrecadação */}
      {fluxos.map((f, i) => (
        <path
          key={`canal-${i}`}
          d={curva(antigos[f.de].y, novos[f.para].y)}
          className="fusao-fluxo"
          style={{ stroke: `url(#fusao-grad-${i})`, strokeWidth: largura(f.peso), animationDelay: `${0.35 + i * 0.1}s` }}
        />
      ))}

      {/* pulsos que seguem viajando pelos canais depois da entrada */}
      {fluxos.map((f, i) => (
        <path
          key={`pulso-${i}`}
          d={curva(antigos[f.de].y, novos[f.para].y)}
          className="fusao-pulso"
          style={{ strokeWidth: Math.max(1.3, largura(f.peso) * 0.42), '--atraso': `${1.5 + i * 0.4}s` } as React.CSSProperties}
        />
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
        <g key={t.sigla} className="fusao-chega" style={{ animationDelay: `${1.05 + i * 0.14}s` }}>
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

/**
 * O índice do atlas, em duas famílias: metade das páginas explica a reforma,
 * metade calcula o efeito dela. A distinção sempre existiu no site e nunca
 * tinha sido dita — é a informação mais útil que este bloco pode dar a quem
 * chega. Nas ferramentas, `informa` declara o custo de entrada: dá para
 * escolher entre um clique e um formulário antes de clicar.
 */
interface EntradaIndice {
  para: string
  titulo: string
  desc: string
  glifo: TipoGlifo
  /** o que o visitante precisa ter em mãos — só nas ferramentas */
  informa?: string
}

const PARA_ENTENDER: EntradaIndice[] = [
  {
    para: '/guia',
    titulo: 'Guia da reforma',
    desc: 'O que muda, por que muda e onde está escrito, com as leis anexadas.',
    glifo: 'guia',
  },
  {
    para: '/linha-do-tempo',
    titulo: 'Linha do tempo',
    desc: 'A transição de 2023 a 2033, ano a ano, com o marcador “você está aqui”.',
    glifo: 'tempo',
  },
  {
    para: '/setores',
    titulo: 'Impacto por setor',
    desc: 'Quem tende a pagar mais, quem tende a pagar menos, e por quê.',
    glifo: 'setores',
  },
  {
    para: '/glossario',
    titulo: 'Glossário e fontes',
    desc: 'Termos pesquisáveis e a biblioteca de documentos oficiais.',
    glifo: 'glossario',
  },
]

const PARA_SIMULAR: EntradaIndice[] = [
  {
    para: '/calculadora',
    titulo: 'Calculadora comparativa',
    desc: 'O preço de um produto ou serviço, hoje e em qualquer ano da transição.',
    glifo: 'calculadora',
    informa: 'um preço',
  },
  {
    para: '/cesta',
    titulo: 'Minha cesta mensal',
    desc: 'O orçamento da família inteiro, categoria por categoria.',
    glifo: 'cesta',
    informa: 'seu mês',
  },
  {
    para: '/cashback',
    titulo: 'Simulador de cashback',
    desc: 'A devolução de imposto para famílias do CadÚnico, conta por conta.',
    glifo: 'cashback',
    informa: 'sua família',
  },
  {
    para: '/raio-x',
    titulo: 'Raio-X da família',
    desc: 'Cesta menos cashback: o efeito líquido do sistema pleno no orçamento.',
    glifo: 'raio-x',
    informa: 'renda e consumo',
  },
  {
    // seção da Calculadora: o parâmetro de receita a abre e rola até ela
    para: '/calculadora?rec=120000',
    titulo: 'Para quem vende',
    desc: 'Onde o seu negócio se encaixa e quanto crédito ele passa ao cliente.',
    glifo: 'vende',
    informa: 'sua receita',
  },
]

/** `entender` são 4 numa linha e as ferramentas 5: a classe dá a largura certa. */
function EntradaDoIndice({ e, familia }: { e: EntradaIndice; familia: 'entender' | 'simular' }) {
  return (
    <Link to={e.para} className={`indice-item${familia === 'entender' ? ' indice-entender' : ''}`}>
      <Glifo tipo={e.glifo} />
      <span className="indice-titulo">{e.titulo}</span>
      <span className="indice-desc">{e.desc}</span>
      {e.informa && (
        <span className="indice-informa mono">
          você informa
          <b>{e.informa}</b>
        </span>
      )}
    </Link>
  )
}

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
          <h2>Por onde começar</h2>
          <p className="secao-desc">
            Metade do atlas explica a reforma. A outra metade calcula o efeito dela no seu caso.
          </p>
          {/* malha única para as duas famílias: assim as nove entradas caem no
              mesmo ritmo de colunas e os glifos se alinham de uma para a outra */}
          <div className="indice">
            <p className="indice-familia">
              <span>Para entender</span>
              <span className="indice-conta mono">{PARA_ENTENDER.length} páginas</span>
            </p>
            {PARA_ENTENDER.map((e) => (
              <EntradaDoIndice key={e.para} e={e} familia="entender" />
            ))}

            <p className="indice-familia">
              <span>Para simular</span>
              <span className="indice-conta mono">{PARA_SIMULAR.length} ferramentas</span>
            </p>
            {PARA_SIMULAR.map((e) => (
              <EntradaDoIndice key={e.para} e={e} familia="simular" />
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
          <h2>Radar da reforma</h2>
          <p className="secao-desc">
            Os marcos que já aconteceram e o próximo da fila — verificados em {RADAR_VERIFICADO_EM}, cada um com o
            texto oficial ao lado.
          </p>
          <ol className="radar">
            {NOVIDADES.map((n) => {
              const f = n.fonteId ? fonte(n.fonteId) : null
              return (
                <li key={n.titulo} className={`radar-item${n.futuro ? ' radar-futuro' : ''}`}>
                  <span className="radar-data mono">{n.data}</span>
                  <div className="radar-corpo">
                    <p className="radar-titulo">
                      {n.titulo} {n.futuro && <Selo tom="destaque">a seguir</Selo>}
                    </p>
                    <p className="radar-texto">{n.texto}</p>
                    {f && (
                      <a className="radar-fonte" href={f.url} target="_blank" rel="noopener noreferrer" title={f.url}>
                        {f.orgao} ↗
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="secao">
          <h2>Direto da fonte</h2>
          <p className="secao-desc">Tudo o que este site afirma aponta para o texto legal. Comece pelos três pilares:</p>
          <div className="fontes-grade">
            <SourceLink fonte={fonte('ec-132')} />
            <SourceLink fonte={fonte('lc-214')} />
            <SourceLink fonte={fonte('lc-227')} />
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
