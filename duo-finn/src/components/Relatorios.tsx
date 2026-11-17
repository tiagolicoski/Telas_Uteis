import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { summarizeInstallments } from '../utils/installments'
import { buildMonthReport } from '../utils/reports'
import { MonthListPicker } from './MonthPicker'
import { monthsByYear } from '../utils/sheet'
import './Relatorios.css'

type ReportScope = 'month' | 'year' | 'all'

export function Relatorios() {
  const { state, formatBRL } = useFinance()
  const [scope, setScope] = useState<ReportScope>('all')
  const [monthPick, setMonthPick] = useState<string | null>(null)
  const [yearPick, setYearPick] = useState<string | null>(null)
  const groups = monthsByYear(state.sheetMonths)
  const years = groups.map((group) => group.year)
  const monthKey = state.sheetMonths.some((month) => month.key === monthPick)
    ? monthPick!
    : state.activeSheetMonthKey
  const activeYear = monthKey.slice(0, 4)
  const year = years.includes(yearPick ?? '') ? yearPick! : activeYear
  const sheets =
    scope === 'all'
      ? state.sheetMonths
      : scope === 'year'
        ? state.sheetMonths.filter((month) => month.key.startsWith(year))
        : state.sheetMonths.filter((month) => month.key === monthKey)
  const report = buildMonthReport(sheets, state.overviewBlockIds)
  const focusLabel =
    scope === 'month'
      ? (sheets[0]?.label ?? 'este mês')
      : scope === 'year'
        ? year
        : null
  const biggest = report.blocks[0]
  const maxBlock = biggest?.amount ?? 0
  const maxItem = report.items[0]?.amount ?? 0
  const installments = summarizeInstallments(
    state.installmentPurchases ?? [],
    scope === 'month' ? { kind: 'month', key: monthKey } : scope === 'year' ? { kind: 'year', year } : { kind: 'all' },
  )
  const maxCard = Math.max(
    0,
    ...installments.byCard.map((card) => Math.max(card.period, card.remaining)),
  )
  const periodTitle = scope === 'month' ? 'Neste mês' : scope === 'year' ? 'Neste ano' : 'Total das compras'

  return (
    <section className="reports">
      <header className="reports-intro">
        <div>
          <h2>Relatórios</h2>
          <p>
            {scope === 'all'
              ? `Soma dos ${report.months.length === 1 ? 'mês lançado' : `${report.months.length} meses lançados`}.`
              : scope === 'year'
                ? `Soma de ${year}.`
                : focusLabel}
            {' '}A sobra segue a mesma conta da visão geral.
          </p>
        </div>
        <div className="reports-filters">
          <div className="reports-scope" role="group" aria-label="Período do relatório">
            {(
              [
                ['month', 'Mês'],
                ['year', 'Ano'],
                ['all', 'Tudo'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={scope === id ? 'active' : undefined}
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {scope === 'month' && (
            <MonthListPicker
              labelMode="month"
              triggerClassName="reports-select"
              ariaLabel="Mês do relatório"
              value={monthKey}
              months={groups.flatMap((group) => group.months)}
              onChange={setMonthPick}
            />
          )}
          {scope === 'year' && (
            <select
              className="reports-select"
              aria-label="Ano do relatório"
              value={year}
              onChange={(event) => setYearPick(event.target.value)}
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="reports-kpis">
        <article className="card">
          <p className="card-title">Entrou</p>
          <p className="card-value-sm">{formatBRL(report.income)}</p>
          <p className="reports-note">Salário e entradas extras</p>
        </article>
        <article className="card">
          <p className="card-title">Saiu</p>
          <p className="card-value-sm">{formatBRL(report.spent)}</p>
          <p className="reports-note">
            {biggest ? `Maior bloco: ${biggest.label}` : 'Nenhum gasto lançado'}
          </p>
        </article>
        <article className="card">
          <p className="card-title">Sobra acumulada</p>
          <p className={`card-value-sm ${report.balance < 0 ? 'negative' : 'positive'}`}>
            {formatBRL(report.balance)}
          </p>
          <p className="reports-note">O que sobrou em cada mês, somado</p>
        </article>
        <article className="card">
          <p className="card-title">Investido</p>
          <p className="card-value-sm">{formatBRL(report.invested)}</p>
          <p className="reports-note">Blocos com investimento no nome</p>
        </article>
      </div>

      <article className="card">
        <p className="card-title">Parcelas</p>
        <p className="reports-note">
          A agenda das compras. Estes valores não entram no saldo da planilha.
        </p>
        {installments.purchaseCount === 0 ? (
          <p className="reports-note">Nenhuma compra parcelada.</p>
        ) : (
          <>
            <div className="reports-installment-stats">
              <div>
                <span>{periodTitle}</span>
                <strong>{formatBRL(installments.periodTotal)}</strong>
              </div>
              <div>
                <span>Falta pagar</span>
                <strong>{formatBRL(installments.remainingAmount)}</strong>
              </div>
              <div>
                <span>Em aberto</span>
                <strong>
                  {installments.openCount} de {installments.purchaseCount}
                </strong>
              </div>
            </div>
            <ul className="reports-bars">
              {installments.byCard.map((card, index) => (
                <li key={card.label}>
                  <div className="reports-bar-label">
                    <span>{card.label}</span>
                    <strong>
                      {formatBRL(card.period)} · falta {formatBRL(card.remaining)}
                    </strong>
                  </div>
                  <div className="reports-track">
                    <div
                      className="reports-fill"
                      style={{
                        width: `${maxCard > 0 ? (Math.max(card.period, card.remaining) / maxCard) * 100 : 0}%`,
                        background: ['#0f766e', '#334155', '#0e7490', '#1d4ed8', '#57534e'][index % 5],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </article>

      <article className="card">
        <p className="card-title">{scope === 'year' ? `Meses de ${year}` : 'Mês a mês'}</p>
        <div className="reports-table" role="table">
          <div className="reports-table-head" role="row">
            <span>Mês</span>
            <span>Entrou</span>
            <span>Saiu</span>
            <span>Investido</span>
            <span>Sobra</span>
          </div>
          {report.months.map((month) => (
            <div key={month.key} className="reports-table-row" role="row">
              <span>{month.label}</span>
              <span>{formatBRL(month.income)}</span>
              <span>{formatBRL(month.spent)}</span>
              <span>{formatBRL(month.invested)}</span>
              <span className={month.balance < 0 ? 'negative' : 'positive'}>
                {formatBRL(month.balance)}
              </span>
            </div>
          ))}
        </div>
      </article>

      <div className="reports-split">
        <article className="card">
          <p className="card-title">Onde foi o dinheiro</p>
          {report.blocks.length === 0 ? (
            <p className="reports-note">Preencha os blocos na planilha.</p>
          ) : (
            <ul className="reports-bars">
              {report.blocks.map((block) => (
                <li key={block.label}>
                  <div className="reports-bar-label">
                    <span>{block.label}</span>
                    <strong>{formatBRL(block.amount)}</strong>
                  </div>
                  <div className="reports-track">
                    <div
                      className="reports-fill"
                      style={{
                        width: `${maxBlock > 0 ? (block.amount / maxBlock) * 100 : 0}%`,
                        background: block.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card">
          <p className="card-title">O que mais se repetiu</p>
          {report.items.length === 0 ? (
            <p className="reports-note">Nenhuma linha com valor.</p>
          ) : (
            <ul className="reports-bars">
              {report.items.map((item) => (
                <li key={item.label}>
                  <div className="reports-bar-label">
                    <span>{item.label}</span>
                    <strong>{formatBRL(item.amount)}</strong>
                  </div>
                  <div className="reports-track">
                    <div
                      className="reports-fill"
                      style={{
                        width: `${maxItem > 0 ? (item.amount / maxItem) * 100 : 0}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
