import { useFinance } from '../context/FinanceContext'
import { OverviewBlockToggles } from './OverviewBlockToggles'
import './SaldoPrevisto.css'

export function SaldoPrevisto() {
  const { derived, formatBRL } = useFinance()
  const { balance, budget, salaryPctLabel, planilhaLabel, coreBlockLabels } =
    derived

  const blocksNote =
    coreBlockLabels.length > 0
      ? coreBlockLabels.join(' · ')
      : 'Nenhum bloco selecionado'

  return (
    <section className="card saldo-card span-saldo">
      <div className="saldo-top">
        <div>
          <p className="card-title">Saldo previsto</p>
          {planilhaLabel && (
            <p className="sync-badge">Planilha: {planilhaLabel}</p>
          )}
          <p className="card-value">{formatBRL(balance)}</p>
          <p className="saldo-note">Desconta: {blocksNote}</p>
          {salaryPctLabel && <span className="badge-up">{salaryPctLabel}</span>}
          <OverviewBlockToggles />
        </div>
      </div>

      <div className="budget-bar">
        {budget.length === 0 ? (
          <div className="budget-segment budget-empty" style={{ width: '100%' }} />
        ) : (
          budget.map((s) => (
            <div
              key={s.id}
              className="budget-segment"
              style={{ width: `${s.pct}%`, background: s.color }}
              title={s.label}
            />
          ))
        )}
      </div>

      {budget.length === 0 ? (
        <p className="empty-hint">
          Escolha os blocos acima e preencha a planilha.
        </p>
      ) : (
        <ul className="budget-legend">
          {budget.map((s) => (
            <li key={s.id}>
              <span className="dot" style={{ background: s.color }} />
              <span className="leg-label">{s.label}</span>
              <span className="leg-value">{formatBRL(s.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
