import { useFinance } from '../context/FinanceContext'
import './Cartoes.css'

const CARD_COLORS = ['#0f766e', '#334155', '#64748b', '#94a3b8', '#0e7490']

export function Cartoes() {
  const { derived, formatBRL } = useFinance()
  const { cardsTotal, cards } = derived

  return (
    <section className="card cartoes-card span-cartoes">
      <div className="cartoes-head">
        <div>
          <p className="card-title">Cartões</p>
          <p className="card-value-sm">{formatBRL(cardsTotal)}</p>
        </div>
      </div>

      {cardsTotal > 0 ? (
        <div className="cartoes-bar" aria-hidden>
          {cards.map((card, index) => (
            <div
              key={card.id}
              style={{
                width: `${(card.amount / cardsTotal) * 100}%`,
                background: CARD_COLORS[index % CARD_COLORS.length],
              }}
            />
          ))}
        </div>
      ) : (
        <p className="empty-hint">Coluna CARTÃO DE CRÉDITO na planilha.</p>
      )}

      <ul className="cartoes-list">
        {cards.length === 0 ? (
          <li className="empty-hint">Coluna CARTÃO DE CRÉDITO na planilha.</li>
        ) : (
          cards.map((card, index) => (
            <li key={card.id}>
              <span
                className="cartao-dot"
                style={{ background: CARD_COLORS[index % CARD_COLORS.length] }}
              />
              <span className="cartao-name">
                {card.bank}
                <span className="cartao-meta">Dia {card.dueDay}</span>
              </span>
              <span className="cartao-value">{formatBRL(card.amount)}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
