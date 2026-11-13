import { useFinance } from '../context/FinanceContext'
import { buildMonthReport } from '../utils/reports'
import './Relatorios.css'

export function Relatorios() {
  const { state, formatBRL } = useFinance()
  const report = buildMonthReport(state.sheetMonths, state.overviewBlockIds)
  const biggest = report.blocks[0]
  const maxBlock = biggest?.amount ?? 0
  const maxItem = report.items[0]?.amount ?? 0

  return (
    <section className="reports">
      <header className="reports-intro">
        <h2>Relatórios</h2>
        <p>
          Soma dos {report.months.length === 1 ? 'mês lançado' : `${report.months.length} meses lançados`}.
          A sobra segue a mesma conta da visão geral.
        </p>
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
        <p className="card-title">Mês a mês</p>
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
