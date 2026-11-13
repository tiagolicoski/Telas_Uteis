import { useFinance } from '../context/FinanceContext'
import './DivisaoCasa.css'

export function DivisaoCasa() {
  const { derived, formatBRL } = useFinance()
  const { house, houseBills } = derived

  return (
    <section className="card divisao-card span-divisao">
      <div className="divisao-head">
        <div>
          <p className="card-title">Divisão da casa</p>
          <p className="card-value-sm">{formatBRL(house.total)}</p>
        </div>
      </div>

      {house.total > 0 ? (
        <>
          <div className="split-labels">
            <span>
              Você paga <strong>{house.youPct.toFixed(1)}%</strong>
            </span>
            <span>
              Esposa paga <strong>{house.spousePct.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="split-bar">
            <div className="split-you" style={{ width: `${house.youPct}%` }} />
            <div className="split-spouse" style={{ width: `${house.spousePct}%` }} />
          </div>
        </>
      ) : (
        <p className="empty-hint">Preencha a coluna CASA na planilha.</p>
      )}

      <ul className="bill-list">
        {houseBills.length === 0 ? (
          <li className="empty-hint">Preencha a coluna CASA na planilha.</li>
        ) : (
          houseBills.map((b) => (
            <li key={b.id}>
              <span className={`payer-dot ${b.payer}`} />
              <span className="bill-name">{b.name}</span>
              <span className="bill-value">{formatBRL(b.amount)}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
