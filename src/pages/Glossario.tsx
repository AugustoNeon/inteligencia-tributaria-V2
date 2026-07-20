import { useMemo, useState } from 'react'
import { CabecalhoPagina } from '../components/layout/Shell'
import { SourceLink } from '../components/ui/kit'
import { GLOSSARIO } from '../data/glossario'
import { FONTES } from '../data/fontes'

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

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
