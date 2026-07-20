import { NavLink, Link } from 'react-router-dom'
import { useState, type ReactNode } from 'react'

const NAV = [
  { para: '/', rotulo: 'Início', fim: true },
  { para: '/guia', rotulo: 'Guia' },
  { para: '/linha-do-tempo', rotulo: 'Linha do tempo' },
  { para: '/calculadora', rotulo: 'Calculadora' },
  { para: '/cesta', rotulo: 'Minha cesta' },
  { para: '/cashback', rotulo: 'Cashback' },
  { para: '/raio-x', rotulo: 'Raio-X' },
  { para: '/setores', rotulo: 'Setores' },
  { para: '/glossario', rotulo: 'Glossário e fontes' },
]

function Marca() {
  return (
    <Link to="/" className="marca" aria-label="Inteligência Tributária — início">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden>
        <rect width="64" height="64" rx="14" fill="var(--petrol-deep)" />
        {/* confluência: o sistema antigo (cobre) e o novo (teal) desaguam num nó só */}
        <path d="M15 20 C 28 20, 28 32, 40 32" fill="none" stroke="#c2622a" strokeWidth="5" strokeLinecap="round" />
        <path d="M15 44 C 28 44, 28 32, 40 32" fill="none" stroke="#3cb5cd" strokeWidth="5" strokeLinecap="round" />
        <circle cx="42" cy="32" r="6.5" fill="#e8f4f8" />
      </svg>
      <span className="marca-nome">
        Inteligência<b>Tributária</b>
      </span>
    </Link>
  )
}

function BotaoTema() {
  const [tema, setTema] = useState(() => (document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'))

  const alternar = () => {
    const novo = tema === 'escuro' ? 'claro' : 'escuro'
    document.documentElement.dataset.tema = novo
    try {
      localStorage.setItem('tema', novo)
    } catch {
      // storage indisponível: o tema vale só para esta visita
    }
    setTema(novo)
  }

  return (
    <button
      className="tema-btn"
      onClick={alternar}
      aria-label={tema === 'escuro' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
    >
      {tema === 'escuro' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
          <path d="M20.7 14.9A8.8 8.8 0 0 1 9.1 3.3 9 9 0 1 0 20.7 14.9Z" />
        </svg>
      )}
    </button>
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
        <BotaoTema />
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
