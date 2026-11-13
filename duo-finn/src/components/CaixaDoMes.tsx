import { useFinance } from '../context/FinanceContext'
import './CaixaDoMes.css'

export function CaixaDoMes() {
  const { derived, formatBRL } = useFinance()
  const { cashTiming, balanceAlert } = derived

  if (!cashTiming && !balanceAlert) return null

  const missingParts = [
    cashTiming?.missingSalaryDay ? 'o salário' : '',
    cashTiming?.missingExtraDay ? 'a entrada extra' : '',
  ].filter(Boolean)

  return (
    <section className="card span-caixa">
      <p className="card-title">Caixa do mês</p>

      {balanceAlert && (
        <p className="cash-alert" role="status">
          Atenção: a sobra deste mês está{' '}
          <strong>{formatBRL(balanceAlert.drop)}</strong> menor que em{' '}
          {balanceAlert.previousLabel} ({formatBRL(balanceAlert.previousBalance)}).
        </p>
      )}

      {missingParts.length > 0 && (
        <p className="cash-hint">
          Informe o dia em que {missingParts.join(' e ')}{' '}
          {missingParts.length > 1 ? 'entram' : 'entra'} na conta, na planilha,
          para ver se o dinheiro chega antes das contas.
        </p>
      )}

      {cashTiming &&
        !cashTiming.missingSalaryDay &&
        cashTiming.shortfall > 0 &&
        cashTiming.shortfallDay && (
        <p className="cash-alert" role="status">
          No dia {cashTiming.shortfallDay} faltam{' '}
          <strong>{formatBRL(cashTiming.shortfall)}</strong> para pagar as contas
          na data. Esse valor precisa estar disponível antes desse dia.
        </p>
      )}

      {cashTiming && !cashTiming.missingSalaryDay && cashTiming.events.length > 0 && (
        <ul className="cash-events">
          {cashTiming.events.map((event, index) => (
            <li key={`${event.day}-${event.kind}-${event.label}-${index}`}>
              <span className="cash-day">Dia {event.day}</span>
              <span className={event.kind === 'in' ? 'positive' : undefined}>
                {event.kind === 'in' ? 'Entra' : 'Sai'} {event.label}
              </span>
              <span className="cash-amount">
                {event.kind === 'in' ? '+' : '−'}
                {formatBRL(event.amount)}
              </span>
              <span className={event.balance < 0 ? 'negative' : 'cash-running'}>
                {formatBRL(event.balance)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {cashTiming && cashTiming.unscheduled > 0 && (
        <p className="cash-hint">
          {formatBRL(cashTiming.unscheduled)} em contas do saldo ainda estão sem
          dia e não entram nessa conta.
        </p>
      )}

      {cashTiming &&
        cashTiming.events.length > 0 &&
        cashTiming.shortfall === 0 &&
        missingParts.length === 0 && (
          <p className="cash-ok">
            Com essas datas, o dinheiro entra a tempo de cobrir as contas.
          </p>
        )}
    </section>
  )
}
