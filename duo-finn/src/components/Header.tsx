import { useEffect, useRef, useState } from 'react'
import { Bell, Calendar, ChevronDown, Menu } from 'lucide-react'
import { NAV_LABELS, useFinance } from '../context/FinanceContext'
import './Header.css'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { state, derived, dispatch, formatBRL } = useFinance()
  const [monthsOpen, setMonthsOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const monthMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const months = [...state.sheetMonths].sort((a, b) => a.key.localeCompare(b.key))
  const menuOpen = monthsOpen || notifsOpen

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!monthMenuRef.current?.contains(target)) setMonthsOpen(false)
      if (!notifRef.current?.contains(target)) setNotifsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMonthsOpen(false)
        setNotifsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])
  const title = NAV_LABELS[state.nav]
  const notes: string[] = []
  if (derived.notifications > 0) {
    const bills = derived.payables.filter((item) => !item.paid).length
    if (bills > 0) notes.push(`${bills} conta(s) não paga(s)`)
  }
  if (derived.balanceAlert) {
    notes.push('A sobra do mês diminuiu em relação ao mês anterior')
  }
  if (
    derived.cashTiming &&
    derived.cashTiming.shortfall > 0 &&
    !derived.cashTiming.missingSalaryDay
  ) {
    notes.push('Falta dinheiro em alguma data antes das contas')
  }
  const bellLabel = notes.length > 0 ? notes.join('. ') : 'Nenhuma pendência'
  const unpaid = derived.payables
    .filter((item) => !item.paid)
    .sort((a, b) => a.dueDay - b.dueDay || a.name.localeCompare(b.name))
  const timingAlert =
    derived.cashTiming &&
    derived.cashTiming.shortfall > 0 &&
    derived.cashTiming.shortfallDay &&
    !derived.cashTiming.missingSalaryDay
      ? derived.cashTiming
      : null

  return (
    <header className="top-header">
      <button
        type="button"
        className="header-menu-btn"
        aria-label="Abrir menu"
        onClick={onMenuClick}
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      <div className="breadcrumb">
        <span className="crumb-muted">Finanças</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{title}</span>
      </div>

      <div className="month-picker-wrap" ref={monthMenuRef}>
        <button
          type="button"
          className="month-picker"
          aria-haspopup="listbox"
          aria-expanded={monthsOpen}
          onClick={() => {
            setNotifsOpen(false)
            setMonthsOpen((open) => !open)
          }}
          title="Escolher o mês"
        >
          <Calendar className="month-picker-icon" size={16} strokeWidth={1.75} aria-hidden />
          {derived.planilhaLabel || state.monthLabel}
          <ChevronDown
            className={`chev ${monthsOpen ? 'open' : ''}`}
            size={16}
            strokeWidth={1.75}
          />
        </button>
        {monthsOpen && (
          <ul className="month-menu" role="listbox" aria-label="Meses">
            {months.map((month) => {
              const selected = month.key === state.activeSheetMonthKey
              return (
                <li key={month.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`month-menu-item ${selected ? 'active' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_SHEET_MONTH', key: month.key })
                      setMonthsOpen(false)
                    }}
                  >
                    {month.label}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="header-actions">
        <div className="notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="icon-btn"
            aria-label={bellLabel}
            aria-haspopup="dialog"
            aria-expanded={notifsOpen}
            onClick={() => {
              setMonthsOpen(false)
              setNotifsOpen((open) => !open)
            }}
          >
            <Bell size={18} strokeWidth={1.75} />
            {derived.notifications > 0 && (
              <span className="notif-badge">{derived.notifications}</span>
            )}
          </button>
          {notifsOpen && (
            <div className="notif-panel" role="dialog" aria-label="Notificações">
              <p className="notif-title">Notificações</p>
              {derived.balanceAlert && (
                <p className="notif-alert">
                  A sobra deste mês está {formatBRL(derived.balanceAlert.drop)} menor
                  que em {derived.balanceAlert.previousLabel}.
                </p>
              )}
              {timingAlert && (
                <p className="notif-alert">
                  No dia {timingAlert.shortfallDay} faltam{' '}
                  {formatBRL(timingAlert.shortfall)} para pagar as contas na data.
                </p>
              )}
              {unpaid.length > 0 ? (
                <ul className="notif-list">
                  {unpaid.map((item) => (
                    <li key={item.id} className="notif-item">
                      <span>
                        <strong>{item.name}</strong>
                        <span className="notif-meta">Dia {item.dueDay}</span>
                      </span>
                      <span className="notif-amount">{formatBRL(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                !derived.balanceAlert &&
                !timingAlert && <p className="notif-empty">Nenhuma pendência.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
