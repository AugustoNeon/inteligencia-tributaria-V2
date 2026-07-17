import { CabecalhoPagina } from '../components/layout/Shell'
import { Callout, Sanfona, Selo, SourceLink } from '../components/ui/kit'
import { ALIQUOTA_REFERENCIA, TRIBUTOS_ANTIGOS, TRIBUTOS_NOVOS } from '../data/tributos'
import { fonte } from '../data/fontes'
import { pct } from '../lib/format'

const PROBLEMAS = [
  {
    titulo: 'Imposto sobre imposto',
    texto:
      'PIS, Cofins, ICMS e ISS convivem com créditos incompletos: cada etapa da cadeia paga tributo sobre um preço que já contém tributo. Esse "resíduo" invisível encarece o produto final.',
  },
  {
    titulo: 'Guerra fiscal',
    texto:
      'Como o ICMS pertence ao estado de origem, estados disputam fábricas com benefícios fiscais — e a conta é paga pelos demais. Com a cobrança no destino, o incentivo desaparece.',
  },
  {
    titulo: 'Complexidade recorde',
    texto:
      'São 27 legislações de ICMS, mais de 5.500 de ISS e um contencioso tributário gigante. O IVA dual unifica base, regras e obrigações acessórias em âmbito nacional.',
  },
  {
    titulo: 'Ninguém sabe quanto paga',
    texto:
      'Tributos "por dentro" escondem a alíquota real: 18% de ICMS por dentro custam 21,95% por fora. CBS e IBS virão destacados na nota, à vista do consumidor.',
  },
]

const MECANISMOS = [
  {
    titulo: 'Não cumulatividade plena',
    texto: 'Tudo que a empresa compra para operar gera crédito. O imposto incide só sobre o valor agregado de cada etapa.',
  },
  {
    titulo: 'Cobrança no destino',
    texto: 'O imposto pertence ao lugar onde o bem ou serviço é consumido — fim do incentivo à guerra fiscal.',
  },
  {
    titulo: 'Imposto "por fora"',
    texto: 'A alíquota incide sobre o preço sem tributo e aparece destacada na nota fiscal, como na Europa e no Canadá.',
  },
  {
    titulo: 'Split payment',
    texto: 'Na liquidação financeira (cartão, Pix), a fatia do imposto segue direto para o fisco — menos sonegação, menos inadimplência.',
  },
  {
    titulo: 'Cashback',
    texto: 'Famílias do CadÚnico recebem de volta 100% da CBS e ao menos 20% do IBS de contas essenciais.',
  },
  {
    titulo: 'Trava de alíquota',
    texto: 'Se a soma das alíquotas de referência passar de 26,5%, o governo é obrigado a propor cortes de benefícios.',
  },
]

const REGIMES = [
  {
    grupo: 'Alíquota zero',
    exemplos: 'Cesta Básica Nacional, medicamentos selecionados (câncer, doenças raras), produtos hortícolas, ovos e frutas, ProUni, reabilitação urbana',
    aliquota: 0,
  },
  {
    grupo: 'Redução de 60%',
    exemplos: 'Saúde, educação, medicamentos em geral, dispositivos médicos, transporte coletivo, insumos agropecuários, alimentos para consumo humano, produções culturais e jornalísticas',
    aliquota: ALIQUOTA_REFERENCIA.total * 0.4,
  },
  {
    grupo: 'Redução de 30%',
    exemplos: 'Profissões intelectuais regulamentadas: advogados, contadores, engenheiros, arquitetos, médicos autônomos…',
    aliquota: ALIQUOTA_REFERENCIA.total * 0.7,
  },
  {
    grupo: 'Regimes específicos',
    exemplos: 'Combustíveis (monofásico), serviços financeiros, planos de saúde, apostas, operações com imóveis, cooperativas, bares e hotelaria',
    aliquota: null,
  },
]

const FAQ = [
  {
    p: 'Os preços vão subir ou cair?',
    r: 'Depende do setor. A reforma foi desenhada para manter a arrecadação total constante: produtos industrializados tendem a ficar mais baratos (fim do efeito cascata), serviços ao consumidor final tendem a encarecer (alíquota maior que o ISS atual), e itens favorecidos — cesta básica, remédios, transporte — ficam mais leves. Use a calculadora deste site para simular caso a caso.',
  },
  {
    p: 'O Simples Nacional acaba?',
    r: 'Não. O Simples continua. A novidade: o optante pode recolher CBS/IBS "por fora" do Simples (regime regular) quando quiser transferir crédito integral a clientes empresas — decisão que pode valer a pena no B2B.',
  },
  {
    p: 'O que acontece com a Zona Franca de Manaus?',
    r: 'Fica preservada. O IPI é zerado no resto do país, mas mantido para produtos que concorrem com os produzidos na ZFM, garantindo o diferencial competitivo da região.',
  },
  {
    p: 'Quando o consumidor começa a sentir?',
    r: 'Em 2026 nada muda no bolso (ano-teste). A partir de 2027, a CBS substitui PIS/Cofins e o cashback começa. A mudança completa nos preços se dá entre 2029 e 2033, quando ICMS e ISS são gradualmente trocados pelo IBS.',
  },
  {
    p: 'E o Imposto de Renda? A reforma mexe nele?',
    r: 'Esta é a reforma do consumo (EC 132/2023). A tributação da renda é discutida em projetos separados — fora do escopo deste guia.',
  },
  {
    p: 'De onde vem o número de 26,5%?',
    r: 'É a estimativa oficial da alíquota de referência somada (CBS + IBS) para manter a arrecadação atual, calculada pelo Ministério da Fazenda. A LC 214 criou uma trava nesse patamar: se estourar, benefícios terão de ser cortados. O número definitivo será fixado por resolução do Senado.',
  },
]

/**
 * Split payment em um desenho: uma compra de R$ 1.000 + IVA de 26,5%.
 * Na liquidação do pagamento, a fatia do imposto segue direto ao fisco.
 */
function SplitPaymentFluxo() {
  return (
    <div className="split-wrap">
      <svg
        viewBox="0 0 720 240"
        className="split-svg"
        role="img"
        aria-label="Fluxo do split payment: o consumidor paga R$ 1.265; na liquidação do pagamento, R$ 265 de CBS e IBS vão direto ao fisco e R$ 1.000 chegam ao vendedor"
      >
        {/* fluxos */}
        <path d="M162,121 L283,121" className="split-fluxo split-fluxo-total" />
        <path d="M437,110 C 500,110 500,56 558,56" className="split-fluxo split-fluxo-fisco" />
        <path d="M437,132 C 500,132 500,184 558,184" className="split-fluxo split-fluxo-vendedor" />
        <text x={497} y={70} textAnchor="middle" className="split-fluxo-rotulo split-fluxo-rotulo-fisco">
          na hora
        </text>

        {/* consumidor */}
        <g>
          <rect x={10} y={95} width={152} height={52} rx={8} className="split-caixa" />
          <text x={86} y={116} textAnchor="middle" className="split-nome">
            Consumidor paga
          </text>
          <text x={86} y={135} textAnchor="middle" className="split-valor">
            R$ 1.265,00
          </text>
        </g>

        {/* liquidação */}
        <g>
          <rect x={285} y={95} width={152} height={52} rx={8} className="split-caixa" />
          <text x={361} y={116} textAnchor="middle" className="split-nome">
            Liquidação
          </text>
          <text x={361} y={134} textAnchor="middle" className="split-detalhe">
            cartão · Pix · boleto
          </text>
        </g>

        {/* fisco */}
        <g>
          <rect x={560} y={30} width={152} height={52} rx={8} className="split-caixa split-caixa-fisco" />
          <text x={636} y={51} textAnchor="middle" className="split-nome split-nome-fisco">
            Fisco — CBS + IBS
          </text>
          <text x={636} y={70} textAnchor="middle" className="split-valor split-valor-fisco">
            R$ 265,00
          </text>
        </g>

        {/* vendedor */}
        <g>
          <rect x={560} y={158} width={152} height={52} rx={8} className="split-caixa" />
          <text x={636} y={179} textAnchor="middle" className="split-nome">
            Vendedor recebe
          </text>
          <text x={636} y={198} textAnchor="middle" className="split-valor">
            R$ 1.000,00
          </text>
        </g>
      </svg>
    </div>
  )
}

export function Guia() {
  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="guia://ec-132.lc-214"
        titulo="A reforma, decodificada"
        descricao="O consumo brasileiro deixa de ser tributado por cinco tributos sobrepostos e passa a um IVA dual — CBS federal e IBS de estados e municípios — mais um Imposto Seletivo. Abaixo, o porquê, o como e o onde-está-escrito."
      />

      <div className="conteudo">
        <section className="secao">
          <h2>Por que mexer em tudo?</h2>
          <p className="secao-desc">
            O sistema atual foi desenhado nos anos 1960 e remendado por décadas. Quatro defeitos estruturais motivaram a
            emenda:
          </p>
          <div className="grade-2">
            {PROBLEMAS.map((p) => (
              <article key={p.titulo} className="bloco-problema">
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="secao">
          <h2>O que sai, o que entra</h2>
          <div className="troca">
            <div className="troca-col">
              <p className="troca-titulo troca-titulo-antigo">Saem até 2033</p>
              {TRIBUTOS_ANTIGOS.map((t) => (
                <article key={t.sigla} className="tributo tributo-antigo">
                  <header>
                    <span className="tributo-sigla" style={{ color: t.cor }}>
                      {t.sigla}
                    </span>
                    <Selo tom="antigo">{t.esfera}</Selo>
                  </header>
                  <p className="tributo-incide">{t.incide}</p>
                  <p className="tributo-destino">{t.destino}</p>
                </article>
              ))}
            </div>
            <div className="troca-col">
              <p className="troca-titulo troca-titulo-novo">Entram a partir de 2026</p>
              {TRIBUTOS_NOVOS.map((t) => (
                <article key={t.sigla} className="tributo tributo-novo">
                  <header>
                    <span className="tributo-sigla" style={{ color: t.cor }}>
                      {t.sigla}
                    </span>
                    <Selo tom="novo">{t.esfera}</Selo>
                  </header>
                  <p className="tributo-nome">{t.nome}</p>
                  <p className="tributo-incide">{t.incide}</p>
                  <p className="tributo-destino">{t.destino}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="secao">
          <h2>Os seis mecanismos que mudam o jogo</h2>
          <div className="grade-3">
            {MECANISMOS.map((m, i) => (
              <article key={m.titulo} className="mecanismo">
                <span className="mecanismo-num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{m.titulo}</h3>
                <p>{m.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="secao">
          <h2>O split payment, visto de perto</h2>
          <p className="secao-desc">
            Uma compra de R$ 1.000 + IVA de 26,5%: na hora em que o pagamento é liquidado, a fatia do imposto se separa
            do dinheiro do vendedor e segue direto ao fisco — sem guia, sem prazo, sem depender de boa vontade.
          </p>
          <SplitPaymentFluxo />
          <p className="split-nota">
            Hoje o vendedor recebe o valor cheio e recolhe o tributo semanas depois; é nesse intervalo que vivem a
            inadimplência e parte da sonegação. Com o split, elas deixam de ser possíveis por construção. A implantação
            será gradual, começando pelos pagamentos eletrônicos.
          </p>
        </section>

        <section className="secao">
          <h2>Nem tudo paga 26,5%</h2>
          <p className="secao-desc">
            A LC 214/2025 criou uma escada de alíquotas. Cada degrau tem lista taxativa — na dúvida, consulte os anexos
            da lei:
          </p>
          <div className="tabela-wrap">
            <table className="tabela-regimes">
              <thead>
                <tr>
                  <th scope="col">Regime</th>
                  <th scope="col">Exemplos</th>
                  <th scope="col">Alíquota estimada</th>
                </tr>
              </thead>
              <tbody>
                {REGIMES.map((r) => (
                  <tr key={r.grupo}>
                    <th scope="row">{r.grupo}</th>
                    <td>{r.exemplos}</td>
                    <td className="mono">{r.aliquota === null ? 'regras próprias' : pct(r.aliquota)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout tom="atencao" titulo="Cuidado com generalizações">
            As listas são taxativas e cheias de exceções (um medicamento pode estar no zero, no 60% ou na alíquota
            padrão). Este guia resume; <strong>o anexo da lei decide</strong>.
          </Callout>
        </section>

        <section className="secao">
          <h2>Perguntas frequentes</h2>
          {FAQ.map((f) => (
            <Sanfona key={f.p} titulo={f.p}>
              <p>{f.r}</p>
            </Sanfona>
          ))}
        </section>

        <section className="secao">
          <h2>Anexos oficiais</h2>
          <p className="secao-desc">Para citar, auditar ou se aprofundar — os textos na fonte:</p>
          <div className="fontes-grade">
            <SourceLink fonte={fonte('ec-132')} />
            <SourceLink fonte={fonte('lc-214')} />
            <SourceLink fonte={fonte('lc-227')} />
            <SourceLink fonte={fonte('portal-fazenda')} />
            <SourceLink fonte={fonte('constituicao')} />
            <SourceLink fonte={fonte('lc-123')} />
          </div>
        </section>
      </div>
    </div>
  )
}
