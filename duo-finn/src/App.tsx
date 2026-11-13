import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { CaixaDoMes } from './components/CaixaDoMes'
import { SaldoPrevisto } from './components/SaldoPrevisto'
import { DivisaoCasa } from './components/DivisaoCasa'
import { Cartoes } from './components/Cartoes'
import { ContasPagar } from './components/ContasPagar'
import { Moradia } from './components/Moradia'
import { DetalhesPlanilha } from './components/DetalhesPlanilha'
import { PlaceholderView } from './components/PlaceholderView'
import { PlanilhaView } from './components/planilha/PlanilhaView'
import { useFinance } from './context/FinanceContext'

function Dashboard() {
  const { derived } = useFinance()
  const { showDivisao, showCartoes, showMoradia, showDetalhes } = derived

  return (
    <div className="dashboard-grid">
      <SaldoPrevisto />
      <div className="col-right">
        <ContasPagar />
        {showMoradia ? <Moradia /> : null}
      </div>
      {showDivisao && <DivisaoCasa />}
      {showCartoes && <Cartoes />}
      {showDetalhes ? <DetalhesPlanilha /> : null}
      <CaixaDoMes />
    </div>
  )
}

function CardsPage() {
  const { derived, setNav } = useFinance()
  const { showCartoes, showDetalhes } = derived

  return (
    <div className="cards-page-grid">
      {showCartoes ? (
        <Cartoes />
      ) : (
        <section className="card span-cartoes">
          <p className="card-title">Cartões</p>
          <p className="cards-empty-hint">
            Nenhum valor no bloco de cartão na planilha deste mês. Preencha a{' '}
            <strong>Planilha</strong>.
          </p>
          <button type="button" className="btn-ghost" onClick={() => setNav('cashflow')}>
            Abrir planilha →
          </button>
        </section>
      )}
      <div className="cards-page-aside">
        {showDetalhes ? <DetalhesPlanilha /> : null}
        <section className="card">
          <p className="card-title">Visão rápida</p>
          <p className="cards-empty-hint">
            A <strong>Visão geral</strong> reúne saldo, contas e divisão da casa no
            mesmo painel.
          </p>
          <button type="button" className="btn-ghost" onClick={() => setNav('overview')}>
            Ir para overview →
          </button>
        </section>
      </div>
    </div>
  )
}

export default function App() {
  const { state } = useFinance()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])

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
          {state.nav === 'overview' && <Dashboard />}
          {state.nav === 'cashflow' && (
            <div className="cashflow-wrap">
              <PlanilhaView />
            </div>
          )}
          {state.nav === 'cards' && <CardsPage />}
          {state.nav !== 'overview' &&
            state.nav !== 'cashflow' &&
            state.nav !== 'cards' && (
              <div className="placeholder-wrap">
                <PlaceholderView />
              </div>
            )}
        </main>
      </div>
    </div>
  )
}
