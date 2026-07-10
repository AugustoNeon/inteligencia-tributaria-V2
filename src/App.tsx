import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Rodape, TopNav } from './components/layout/Shell'
import { Home } from './pages/Home'
import { Guia } from './pages/Guia'
import { LinhaDoTempo } from './pages/LinhaDoTempo'
import { Calculadora } from './pages/Calculadora'
import { Cashback } from './pages/Cashback'
import { Setores } from './pages/Setores'
import { Glossario } from './pages/Glossario'

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guia" element={<Guia />} />
          <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="/cashback" element={<Cashback />} />
          <Route path="/setores" element={<Setores />} />
          <Route path="/glossario" element={<Glossario />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Rodape />
    </HashRouter>
  )
}
