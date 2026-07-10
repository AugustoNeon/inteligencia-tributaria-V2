import { NavLink, Link } from 'react-router-dom'
import type { ReactNode } from 'react'

const NAV = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/guia', rotulo: 'Guia' },
  { para: '/linha-do-tempo', rotulo: 'Linha do tempo' },
  { para: '/calculadora', rotulo: 'Calculadora' },
  { para: '/cashback', rotulo: 'Cashback' },
  { para: '/setores', rotulo: 'Setores' },
  { para: '/glossario', rotulo: 'Glossário e fontes' },
]

function Marca() {
  return (
    <Link to="/" className="marca" aria-label="Inteligência Tributária — início">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--petrol-deep)" />
        <path d="M20 44 L44 20" stroke="#e8f4f8" strokeWidth="5" strokeLinecap="round" />
        <circle cx="23" cy="23" r="6.5" fill="none" stroke="#3cb5cd" strokeWidth="5" />
        <circle cx="41" cy="41" r="6.5" fill="none" stroke="#c2622a" strokeWidth="5" />
      </svg>
      <span className="marca-nome">
        Inteligência<b>Tributária</b>
      </span>
    </Link>
  )
}

export function TopNav() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Marca />
        <nav className="nav" aria-label="Principal">
          {NAV.map((item) => (
            <NavLink key={item.para} to={item.para} end={item.fim} className={({ isActive }) => (isActive ? 'on' : '')}>
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="rodape-inner">
        <p>
          <strong>Inteligência Tributária</strong> — projeto educacional e de portfólio. As simulações são estimativas
          didáticas baseadas na EC 132/2023 e na LC 214/2025 e <em>não substituem</em> orientação contábil ou jurídica.
        </p>
        <p className="rodape-meta">
          Alíquota de referência estimada: 26,5% (CBS 8,8% + IBS 17,7%) · Fontes oficiais na página{' '}
          <Link to="/glossario">Glossário e fontes</Link> · Código em{' '}
          <a href="https://github.com/AugustoNeon/inteligencia-tributaria-V2" target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </p>
      </div>
    </footer>
  )
}

/** Cabeçalho padrão de página interna — faixa petróleo com título display. */
export function CabecalhoPagina({ kicker, titulo, descricao, children }: { kicker: string; titulo: string; descricao: string; children?: ReactNode }) {
  return (
    <section className="pagina-cab">
      <div className="pagina-cab-inner">
        <p className="pagina-kicker">{kicker}</p>
        <h1>{titulo}</h1>
        <p className="pagina-desc">{descricao}</p>
        {children}
      </div>
    </section>
  )
}
