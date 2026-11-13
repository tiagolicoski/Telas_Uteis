import { getSheetMonth } from '../utils/sheet'
import { useFinance } from '../context/FinanceContext'
import './OverviewBlockToggles.css'

export function OverviewBlockToggles() {
  const { state, toggleOverviewBlock } = useFinance()
  const sheet = getSheetMonth(state.sheetMonths, state.activeSheetMonthKey)
  const options = sheet?.categories ?? []
  const active = new Set(state.overviewBlockIds)

  if (options.length === 0) return null

  return (
    <div className="overview-blocks">
      <span className="overview-blocks-label">Blocos no saldo previsto:</span>
      <div className="overview-blocks-chips" role="group" aria-label="Blocos da planilha no saldo">
        {options.map((cat) => {
          const on = active.has(cat.id)
          return (
            <button
              key={cat.id}
              type="button"
              className={`overview-chip ${on ? 'on' : ''}`}
              aria-pressed={on}
              onClick={() => toggleOverviewBlock(cat.id)}
              title={
                on
                  ? 'Remover do cálculo da visão geral'
                  : 'Incluir no cálculo da visão geral'
              }
            >
              {on ? '✓ ' : ''}
              {cat.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
