import { useFinance } from '../context/FinanceContext'
import './Moradia.css'

export function Moradia() {
  const { derived, formatBRL } = useFinance()
  const { moradiaTotal, moradiaItems, monthlySalary } = derived
  const pctOfSalary = monthlySalary > 0 ? (moradiaTotal / monthlySalary) * 100 : 0
  const barWidth = Math.min(100, pctOfSalary)

  return (
    <section className="card moradia-card">
      <div className="moradia-head">
        <div>
          <p className="card-title">Moradia</p>
          <p className="moradia-sub">Quanto você gasta pra morar</p>
          <p className="card-value-sm">{formatBRL(moradiaTotal)}</p>
        </div>
        <div className="house-illus">🏡</div>
      </div>

      <div className="salary-bar-wrap">
        <div className="salary-bar">
          <div className="salary-fill" style={{ width: `${barWidth}%` }} />
        </div>
        <span className="salary-hint">
          {monthlySalary > 0
            ? `${pctOfSalary.toFixed(0)}% do salário (planilha)`
            : 'Informe o salário líquido na planilha'}
        </span>
      </div>

      <div className="moradia-grid">
        {moradiaItems.length === 0 ? (
          <p className="empty-hint" style={{ gridColumn: '1 / -1' }}>
            Itens de moradia na coluna CASA (e linha de aluguel).
          </p>
        ) : (
          moradiaItems.map((item) => (
            <div key={item.id} className="moradia-item">
              <span className="mi-icon">{item.icon}</span>
              <span className="mi-label">{item.label}</span>
              <span className="mi-value">{formatBRL(item.amount)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
