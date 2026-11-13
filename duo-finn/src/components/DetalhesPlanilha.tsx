import { memo } from 'react'
import { BLOCK_COLORS } from '../data/sheetCategories'
import { useFinance } from '../context/FinanceContext'
import type { DetailBlock } from '../utils/overviewFromSheet'
import './DetalhesPlanilha.css'

function ChartBar({
  label,
  amount,
  maxVal,
  color,
  muted,
  formatBRL,
}: {
  label: string
  amount: number
  maxVal: number
  color: string
  muted?: boolean
  formatBRL: (n: number) => string
}) {
  const pct = amount > 0 && maxVal > 0 ? (amount / maxVal) * 100 : 0
  return (
    <div className={`detalhe-chart-row ${muted ? 'detalhe-chart-row--item' : 'detalhe-chart-row--block'}`}>
      <span className="detalhe-chart-label" title={label}>
        {label}
      </span>
      <div className="detalhe-chart-bar-track">
        <div
          className="detalhe-chart-bar"
          style={{
            width: `${pct}%`,
            background: color,
            opacity: muted ? 0.85 : 1,
          }}
        />
      </div>
      <span className="detalhe-chart-value">
        {amount > 0 ? formatBRL(amount) : '—'}
      </span>
    </div>
  )
}

function maxAmountAcrossDetail(blocks: DetailBlock[]) {
  let max = 0
  for (const b of blocks) {
    max = Math.max(max, b.total)
    for (const l of b.lines) {
      if (l.amount > 0) max = Math.max(max, l.amount)
    }
  }
  return Math.max(max, 1)
}

export const DetalhesPlanilha = memo(function DetalhesPlanilha() {
  const { derived, formatBRL } = useFinance()
  const { detailBlocks, detailExpensesTotal } = derived

  const maxVal = maxAmountAcrossDetail(detailBlocks)
  const hasAny =
    detailBlocks.some((b) => b.total > 0) ||
    detailBlocks.some((b) => b.lines.some((l) => l.amount > 0))

  return (
    <section className="card detalhes-planilha span-detalhes">
      <header className="detalhes-head">
        <div>
          <p className="card-title">Detalhes da planilha</p>
          <p className="detalhes-sub">
            Itens fora do saldo previsto — por bloco e por linha
          </p>
        </div>
      </header>

      <div className="detalhes-chart">
        {detailBlocks.map((block) => {
          const color = BLOCK_COLORS[block.id] ?? '#94a3b8'

          return (
            <div key={block.id} className="detalhe-block-group">
              <ChartBar
                label={block.title}
                amount={block.total}
                maxVal={maxVal}
                color={color}
                formatBRL={formatBRL}
              />
              <div className="detalhe-lines">
                {block.lines.map((line) => (
                  <ChartBar
                    key={line.id}
                    label={line.label}
                    amount={line.amount}
                    maxVal={maxVal}
                    color={color}
                    muted
                    formatBRL={formatBRL}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {!hasAny && (
        <p className="empty-hint detalhes-empty">
          Nenhum valor nestes blocos — preencha na planilha.
        </p>
      )}

      <footer className="detalhes-footer">
        <span className="detalhes-footer-label">Total gasto (detalhes)</span>
        <span className="detalhes-footer-value">{formatBRL(detailExpensesTotal)}</span>
      </footer>
    </section>
  )
})
