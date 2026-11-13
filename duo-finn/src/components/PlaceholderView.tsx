import { NAV_LABELS, useFinance } from '../context/FinanceContext'
import './PlaceholderView.css'

export function PlaceholderView() {
  const { state, setNav } = useFinance()
  const title = NAV_LABELS[state.nav]

  return (
    <section className="card placeholder-view">
      <h2>{title}</h2>
      <p>
        Esta seção ainda não tem tela própria. Use <strong>Visão geral</strong> para
        lançar contas e acompanhar o mês.
      </p>
      <button type="button" className="btn-link" onClick={() => setNav('overview')}>
        Ir para visão geral
      </button>
    </section>
  )
}
