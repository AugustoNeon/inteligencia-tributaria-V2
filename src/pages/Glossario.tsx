import { useMemo, useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { Sanfona, Selo, SourceLink } from '../components/ui/kit'
import { GLOSSARIO } from '../data/glossario'
import { FONTES } from '../data/fontes'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const COMPARATIVO = [
  {
    fator: 'Quantos tributos incidem sobre o consumo',
    hoje: '5 tributos: PIS, Cofins, ICMS, ISS e IPI',
    depois: '3 tributos: CBS, IBS e Imposto Seletivo',
  },
  {
    fator: 'Legislação',
    hoje: '27 leis estaduais de ICMS + milhares de leis municipais de ISS',
    depois: 'Uma lei nacional única para CBS e IBS — a LC 214/2025',
  },
  {
    fator: 'Onde o imposto é cobrado',
    hoje: 'Na origem — onde o bem é produzido ou a empresa está sediada',
    depois: 'No destino — onde o bem ou serviço é consumido',
  },
  {
    fator: 'Crédito entre as etapas da cadeia',
    hoje: 'Parcial: créditos incompletos deixam um "resíduo tributário" escondido no preço',
    depois: 'Pleno: tudo o que a empresa compra para operar gera crédito',
  },
  {
    fator: 'Transparência do preço',
    hoje: 'Impostos "por dentro" — embutidos no preço, alíquota real difícil de enxergar',
    depois: 'Impostos "por fora" — destacados na nota fiscal, à vista do consumidor',
  },
  {
    fator: 'Devolução para famílias de baixa renda',
    hoje: 'Não existe mecanismo automático e amplo de devolução',
    depois: 'Cashback automático: 100% da CBS e ao menos 20% do IBS para o CadÚnico',
  },
  {
    fator: 'Recolhimento do imposto',
    hoje: 'O vendedor recebe o valor cheio e recolhe o imposto depois — janela para sonegação e inadimplência',
    depois: 'Split payment: a fatia do imposto vai direto ao fisco na hora da liquidação do pagamento',
  },
  {
    fator: 'Guerra fiscal entre estados e municípios',
    hoje: 'Ativa — benefícios de ICMS/ISS disputam a instalação de empresas',
    depois: 'Sem razão de existir — benefícios vigentes são compensados por fundo até 2032',
  },
]

const DUVIDAS = [
  {
    p: 'IBS e CBS são o mesmo imposto com nomes diferentes?',
    r: 'Não. Os dois compartilham a mesma base de cálculo, a mesma não cumulatividade e a mesma lei (LC 214/2025) — por isso formam o "IVA dual" — mas são tributos distintos: a CBS é federal, arrecadada pela Receita Federal; o IBS é de estados e municípios, arrecadado e distribuído pelo Comitê Gestor do IBS. Cada um tem alíquota própria (estimativas de 8,8% e 17,7%).',
  },
  {
    p: 'Por que dois impostos em vez de um só?',
    r: 'Questão federativa: a Constituição reparte a competência de tributar entre União, estados e municípios, e unificar tudo em um único imposto exigiria reorganizar essa divisão de poder. O IVA dual preserva a competência de cada esfera, mas com regras idênticas — na prática, funciona quase como um imposto só.',
  },
  {
    p: 'A alíquota de referência de 26,5% é o que eu vou pagar?',
    r: 'Não necessariamente. Ela é a soma estimada de CBS e IBS para bens e serviços na alíquota padrão, calculada para manter a arrecadação atual constante. Itens da Cesta Básica pagam 0%, saúde e educação têm redução de 60%, profissões regulamentadas têm redução de 30%. Use a Calculadora deste site para ver a alíquota efetiva do seu caso.',
  },
  {
    p: 'Esses termos têm força de lei, ou são apelidos deste site?',
    r: 'Alguns — como split payment, cashback e Comitê Gestor do IBS — aparecem quase literalmente na EC 132/2023 e na LC 214/2025. Outros, como "imposto por fora" e "resíduo tributário", são traduções em linguagem simples usadas por especialistas e pela imprensa. Nos dois casos, o texto oficial listado em "Documentos oficiais" abaixo é sempre a referência final.',
  },
  {
    p: 'Estados e municípios perdem toda a arrecadação de uma vez?',
    r: 'Não. A troca de tributos termina em 2033, mas a redistribuição da receita do IBS entre estados e municípios — da origem para o destino — é gradual até 2078, e um Fundo de Compensação cobre benefícios fiscais de ICMS que perdem validade até 2032. Veja "Transição federativa" no glossário acima.',
  },
  {
    p: 'Este glossário é atualizado conforme a reforma avança?',
    r: 'Sim — é revisado à medida que novas normas são sancionadas (como a LC 227/2026, do Comitê Gestor). Para o texto legal exato e mudanças recentes, confira o Portal da Reforma Tributária do Consumo na seção "Documentos oficiais".',
  },
]

export function Glossario() {
  const [busca, setBusca] = useState('')

  const termos = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return GLOSSARIO
    return GLOSSARIO.filter((t) => normalizar(`${t.termo} ${t.definicao}`).includes(q))
  }, [busca])

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="ref://termos.fontes"
        titulo="Glossário e fontes"
        descricao="Os termos da reforma explicados em português claro — e todos os documentos oficiais usados por este site, prontos para consulta."
      />

      <div className="conteudo">
        <section className="secao">
          <label className="busca">
            <span className="visually-hidden">Buscar termo</span>
            <input
              type="search"
              placeholder="Buscar termo… (ex.: split payment, cashback, destino)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <span className="busca-contagem mono">
              {termos.length} {termos.length === 1 ? 'termo' : 'termos'}
            </span>
          </label>

          {termos.length === 0 ? (
            <div className="vazio">
              <p>
                Nada encontrado para <strong>"{busca}"</strong>.
              </p>
              <p className="vazio-dica">
                Tente outra grafia — ou{' '}
                <button className="link-botao" onClick={() => setBusca('')}>
                  limpe a busca
                </button>{' '}
                para ver os {GLOSSARIO.length} termos.
              </p>
            </div>
          ) : (
            <dl className="glossario">
              {termos.map((t) => (
                <div key={t.termo} className="glossario-item">
                  <dt>{t.termo}</dt>
                  <dd>
                    {t.definicao}
                    {t.relacionados && (
                      <span className="glossario-rel">
                        {t.relacionados.map((r) => (
                          <button key={r} className="glossario-tag" onClick={() => setBusca(r)}>
                            {r}
                          </button>
                        ))}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="secao">
          <h2>Hoje x depois da reforma</h2>
          <p className="secao-desc">
            Mesmo fator, dois sistemas. Como cada um funciona hoje — e como vai funcionar quando a reforma estiver
            totalmente implantada, a partir de 2033.
          </p>
          <div className="tabela-wrap">
            <table className="tabela-regimes">
              <thead>
                <tr>
                  <th scope="col">Fator</th>
                  <th scope="col">
                    <Selo tom="antigo">Hoje</Selo>
                  </th>
                  <th scope="col">
                    <Selo tom="novo">A partir de 2033</Selo>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIVO.map((c) => (
                  <tr key={c.fator}>
                    <th scope="row">{c.fator}</th>
                    <td>{c.hoje}</td>
                    <td>{c.depois}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="secao">
          <h2>Dúvidas frequentes</h2>
          {DUVIDAS.map((d) => (
            <Sanfona key={d.p} titulo={d.p}>
              <p>{d.r}</p>
            </Sanfona>
          ))}
        </section>

        <section className="secao">
          <h2>Documentos oficiais</h2>
          <p className="secao-desc">A biblioteca completa deste projeto — clique para abrir o texto na fonte:</p>
          <div className="fontes-grade">
            {FONTES.map((f) => (
              <SourceLink key={f.id} fonte={f} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
