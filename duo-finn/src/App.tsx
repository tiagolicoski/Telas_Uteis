import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CaixaDoMes } from './components/CaixaDoMes'
import { SaldoPrevisto } from './components/SaldoPrevisto'
import { Cartoes } from './components/Cartoes'
import { ContasPagar } from './components/ContasPagar'
import { Moradia } from './components/Moradia'
import { DetalhesPlanilha } from './components/DetalhesPlanilha'
import { PlanilhaView } from './components/planilha/PlanilhaView'
import { Relatorios } from './components/Relatorios'
import { useFinance } from './context/FinanceContext'

function Dashboard() {
  const { derived } = useFinance()
  const { showCartoes, showMoradia, showDetalhes } = derived

  return (
    <div className="dashboard-grid">
      <div className="dash-main">
        <SaldoPrevisto />
      </div>
      <div className="dash-side">
        <ContasPagar />
        {showMoradia ? <Moradia /> : null}
      </div>
      {showCartoes && <Cartoes />}
      {showDetalhes ? <DetalhesPlanilha /> : null}
      <CaixaDoMes />
    </div>
  )
}

export default function App() {
  const { state, setNav } = useFinance()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])

  useEffect(() => {
    if (state.nav !== 'overview' && state.nav !== 'cashflow' && state.nav !== 'reports') {
      setNav('overview')
    }
  }, [state.nav, setNav])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)')
    const onChange = () => {
      if (mq.matches) setDrawerOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`sidebar-backdrop ${drawerOpen ? 'is-open' : ''}`}
        aria-label="Fechar menu"
        onClick={closeDrawer}
        tabIndex={drawerOpen ? 0 : -1}
      />
      <Sidebar mobileOpen={drawerOpen} onNavigate={closeDrawer} />
      <h1 className="screen-reader-only">Duo Finn — Finanças em casal</h1>
      <div className="main-wrap">
        <Header onMenuClick={openDrawer} />
        <main className="main-content">
          {state.nav === 'cashflow' ? (
            <div className="cashflow-wrap">
              <PlanilhaView />
            </div>
          ) : state.nav === 'reports' ? (
            <Relatorios />
          ) : (
            <Dashboard />
          )}
        </main>
      </div>
    </div>
  )
}
