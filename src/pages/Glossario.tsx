import { useMemo, useRef, useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { SourceLink } from '../components/ui/kit'
import { CATEGORIAS_GLOSSARIO, GLOSSARIO, type CategoriaGlossario } from '../data/glossario'
import { FONTES } from '../data/fontes'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

type Filtro = CategoriaGlossario | 'tudo'

export function Glossario() {
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState<Filtro>('tudo')
  const mainRef = useRef<HTMLDivElement>(null)

  const buscando = busca.trim() !== ''

  const contagem = useMemo(() => {
    const m = new Map<CategoriaGlossario, number>()
    for (const t of GLOSSARIO) m.set(t.categoria, (m.get(t.categoria) ?? 0) + 1)
    return m
  }, [])

  // busca (texto) vence o filtro de categoria: resultado plano entre todos os termos
  const resultadosBusca = useMemo(() => {
    const q = normalizar(busca.trim())
    if (!q) return []
    return GLOSSARIO.filter((t) => normalizar(`${t.termo} ${t.definicao}`).includes(q))
  }, [busca])

  // categorias a renderizar quando não se está buscando
  const categoriasVisiveis = cat === 'tudo' ? CATEGORIAS_GLOSSARIO : CATEGORIAS_GLOSSARIO.filter((c) => c.id === cat)

  const selecionar = (proximo: Filtro) => {
    setBusca('')
    setCat(proximo)
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const irParaRelacionado = (termo: string) => {
    setCat('tudo')
    setBusca(termo)
  }

  return (
    <div className="page-enter">
      <CabecalhoPagina
        kicker="ref://termos.fontes"
        titulo="Glossário e fontes"
        descricao="Os termos da reforma explicados em português claro, organizados por tema — e todos os documentos oficiais usados por este site, prontos para consulta."
      />

      <div className="conteudo glossario-layout">
        <nav className="pagina-indice" aria-label="Categorias do glossário">
          <p className="indice-titulo">Nesta página</p>
          <ul className="indice-lista">
            <li>
              <button
                className={`indice-item${cat === 'tudo' && !buscando ? ' on' : ''}`}
                aria-current={cat === 'tudo' && !buscando ? 'true' : undefined}
                onClick={() => selecionar('tudo')}
              >
                <span>Todos os termos</span>
                <span className="indice-cont mono">{GLOSSARIO.length}</span>
              </button>
            </li>
            {CATEGORIAS_GLOSSARIO.map((c) => (
              <li key={c.id}>
                <button
                  className={`indice-item${cat === c.id && !buscando ? ' on' : ''}`}
                  aria-current={cat === c.id && !buscando ? 'true' : undefined}
                  onClick={() => selecionar(c.id)}
                >
                  <span>{c.rotulo}</span>
                  <span className="indice-cont mono">{contagem.get(c.id) ?? 0}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="indice-nota">
            Documentos oficiais <span aria-hidden>↓</span>
          </p>
        </nav>

        <div className="glossario-main" ref={mainRef}>
          <label className="busca">
            <span className="visually-hidden">Buscar termo</span>
            <input
              type="search"
              placeholder="Buscar termo… (ex.: split payment, cashback, destino)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <span className="busca-contagem mono">
              {buscando ? resultadosBusca.length : GLOSSARIO.length}{' '}
              {(buscando ? resultadosBusca.length : GLOSSARIO.length) === 1 ? 'termo' : 'termos'}
            </span>
          </label>

          {/* chips: o mesmo filtro do índice, para telas estreitas e acesso rápido */}
          <div className="chips glossario-chips" role="group" aria-label="Filtrar por categoria">
            <button className={`chip${cat === 'tudo' && !buscando ? ' on' : ''}`} onClick={() => selecionar('tudo')}>
              Tudo
            </button>
            {CATEGORIAS_GLOSSARIO.map((c) => (
              <button
                key={c.id}
                className={`chip${cat === c.id && !buscando ? ' on' : ''}`}
                onClick={() => selecionar(c.id)}
              >
                {c.rotulo}
              </button>
            ))}
          </div>

          {buscando ? (
            resultadosBusca.length === 0 ? (
              <div className="vazio">
                <p>
                  Nada encontrado para <strong>"{busca}"</strong>.
                </p>
                <p className="vazio-dica">
                  Tente outra grafia — ou{' '}
                  <button className="link-botao" onClick={() => selecionar('tudo')}>
                    limpe a busca
                  </button>{' '}
                  para ver os {GLOSSARIO.length} termos.
                </p>
              </div>
            ) : (
              <dl className="glossario">
                {resultadosBusca.map((t) => (
                  <TermoItem key={t.termo} termo={t} onRelacionado={irParaRelacionado} />
                ))}
              </dl>
            )
          ) : (
            categoriasVisiveis.map((c) => {
              const termos = GLOSSARIO.filter((t) => t.categoria === c.id)
              return (
                <section key={c.id} className="glossario-grupo" aria-labelledby={`cat-${c.id}`}>
                  <div className="glossario-grupo-cab">
                    <h2 id={`cat-${c.id}`}>{c.rotulo}</h2>
                    <p className="glossario-grupo-resumo">{c.resumo}</p>
                  </div>
                  <dl className="glossario">
                    {termos.map((t) => (
                      <TermoItem key={t.termo} termo={t} onRelacionado={irParaRelacionado} />
                    ))}
                  </dl>
                </section>
              )
            })
          )}

          <section className="secao" id="documentos-oficiais">
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
    </div>
  )
}

function TermoItem({
  termo,
  onRelacionado,
}: {
  termo: (typeof GLOSSARIO)[number]
  onRelacionado: (t: string) => void
}) {
  return (
    <div className="glossario-item">
      <dt>{termo.termo}</dt>
      <dd>
        {termo.definicao}
        {termo.relacionados && (
          <span className="glossario-rel">
            {termo.relacionados.map((r) => (
              <button key={r} className="glossario-tag" onClick={() => onRelacionado(r)}>
                {r}
              </button>
            ))}
          </span>
        )}
      </dd>
    </div>
  )
}
