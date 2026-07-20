import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Rodape, TopNav } from './components/layout/Shell'
import { ChatIA, chatDisponivel } from './components/ChatIA'

// code splitting por rota: cada página vira um chunk carregado sob demanda —
// quem abre a Calculadora não baixa o Raio-X (nem a malha do mapa, que pesa)
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const Guia = lazy(() => import('./pages/Guia').then((m) => ({ default: m.Guia })))
const LinhaDoTempo = lazy(() => import('./pages/LinhaDoTempo').then((m) => ({ default: m.LinhaDoTempo })))
const Calculadora = lazy(() => import('./pages/Calculadora').then((m) => ({ default: m.Calculadora })))
const CestaMensal = lazy(() => import('./pages/CestaMensal').then((m) => ({ default: m.CestaMensal })))
const Cashback = lazy(() => import('./pages/Cashback').then((m) => ({ default: m.Cashback })))
const Painel = lazy(() => import('./pages/Painel').then((m) => ({ default: m.Painel })))
const Setores = lazy(() => import('./pages/Setores').then((m) => ({ default: m.Setores })))
const Glossario = lazy(() => import('./pages/Glossario').then((m) => ({ default: m.Glossario })))
const AdminIA = lazy(() => import('./pages/AdminIA').then((m) => ({ default: m.AdminIA })))

function AoTrocarDeRota() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export function App() {
  return (
    <HashRouter>
      <AoTrocarDeRota />
      <TopNav />
      <main>
        <Suspense fallback={<div className="pagina-carregando mono" aria-busy="true">carregando…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/guia" element={<Guia />} />
            <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
            <Route path="/calculadora" element={<Calculadora />} />
            <Route path="/cesta" element={<CestaMensal />} />
            <Route path="/cashback" element={<Cashback />} />
            <Route path="/raio-x" element={<Painel />} />
            <Route path="/setores" element={<Setores />} />
            <Route path="/glossario" element={<Glossario />} />
            <Route path="/admin-ia" element={<AdminIA />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <Rodape />
      {/* fora das rotas: a conversa sobrevive à navegação entre páginas */}
      {chatDisponivel() && <ChatIA />}
    </HashRouter>
  )
}
