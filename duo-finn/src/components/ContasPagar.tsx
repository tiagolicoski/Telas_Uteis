import { useFinance } from '../context/FinanceContext'
import './ContasPagar.css'

export function ContasPagar() {
  const { state, derived, formatBRL, setPayDay, togglePayable } = useFinance()
  const { payDays, payablesVisible, payablesDayTotal, payables } = derived
  const day = state.selectedPayDay

  return (
    <section className="card contas-card">
      <div className="contas-head">
        <div>
          <p className="card-title">Contas a pagar</p>
          <p className="card-value-sm">{formatBRL(payablesDayTotal)}</p>
          {day !== null && payables.length > 0 && (
            <p className="day-sub">Dia {String(day).padStart(2, '0')}</p>
          )}
        </div>
        <div className="calendar-illus">📅</div>
      </div>

      {payDays.length > 0 ? (
        <div className="day-scroll">
          {payDays.map((d) => (
            <button
              key={d}
              type="button"
              className={`day-chip ${day === d ? 'active' : ''}`}
              onClick={() => setPayDay(d)}
            >
              {String(d).padStart(2, '0')}
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-hint">Lançe valores nas colunas da planilha.</p>
      )}

      <ul className="task-list">
        {payablesVisible.length === 0 ? (
          <li className="empty-hint">
            {payables.length === 0
              ? 'CASA e CARTÃO na planilha (com valor).'
              : 'Nada neste dia.'}
          </li>
        ) : (
          payablesVisible.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`check ${t.paid ? 'checked' : ''}`}
                aria-label={t.paid ? 'Pago' : 'Marcar pago'}
                onClick={() => togglePayable(t.id)}
              />
              <span className={`task-name ${t.paid ? 'done' : ''}`}>{t.name}</span>
              <span className="task-value">{formatBRL(t.amount)}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
