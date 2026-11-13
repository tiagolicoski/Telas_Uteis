import { useFinance } from '../context/FinanceContext'
import './Cartoes.css'

export function Cartoes() {
  const { state, derived, formatBRL, prevCard, nextCard } = useFinance()
  const { cardsTotal, cards } = derived
  const idx = cards.length > 0 ? state.activeCardIndex % cards.length : -1
  const current = idx >= 0 ? cards[idx] : null
  const prev = cards.length > 1 ? cards[(idx - 1 + cards.length) % cards.length] : null

  const chartPoints =
    cards.length > 0
      ? cards.map((c) => Math.min(100, c.amount > 0 ? 20 + (c.amount % 80) : 5))
      : [0, 0, 0]

  return (
    <section className="card cartoes-card span-cartoes">
      <div className="cartoes-head">
        <div>
          <p className="card-title">Cartões</p>
          <p className="card-value-sm">{formatBRL(cardsTotal)}</p>
        </div>
        <div className="carousel-nav">
          <button
            type="button"
            aria-label="Anterior"
            onClick={prevCard}
            disabled={cards.length < 2}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={nextCard}
            disabled={cards.length < 2}
          >
            ›
          </button>
        </div>
      </div>

      {current ? (
        <div className="card-stack">
          {prev && prev.id !== current.id && (
            <div
              className={`credit-card side ${prev.color === 'orange' ? 'itau' : 'dark-side'}`}
            >
              {prev.bank}
            </div>
          )}
          <div className="credit-card main">
            <p className="bank">{current.bank}</p>
            <p className="tier">{current.tier}</p>
            <span className="chip" />
            <p className="limit">Fatura {formatBRL(current.amount)}</p>
            <div className="card-meta">
              <span>{current.status === 'open' ? 'Aberta' : 'Fechada'}</span>
              <span>Vence dia {current.dueDay}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-hint">Coluna CARTÃO DE CRÉDITO na planilha.</p>
      )}

      <p className="chart-label">Projeção das faturas</p>
      <div className="mini-chart">
        <svg viewBox="0 0 200 50" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            points={chartPoints
              .map((y, i) => {
                const x =
                  chartPoints.length > 1
                    ? (i / (chartPoints.length - 1)) * 200
                    : 100
                return `${x},${50 - y * 0.45}`
              })
              .join(' ')}
          />
        </svg>
        <div className="chart-months">
          <span>Atual</span>
          <span>+1 mês</span>
          <span>+2 meses</span>
        </div>
      </div>
    </section>
  )
}
