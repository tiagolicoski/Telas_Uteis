import type { BudgetLine, HouseBill, Payable } from '../data/types'
import { pct } from './format'

export function houseTotals(bills: HouseBill[]) {
  const total = bills.reduce((s, b) => s + b.amount, 0)
  const you = bills
    .filter((b) => b.payer === 'you')
    .reduce((s, b) => s + b.amount, 0)
  const spouse = total - you
  const youPct = pct(you, total)
  const spousePct = pct(spouse, total)
  return { total, you, spouse, youPct, spousePct }
}

export function payablesForDay(payables: Payable[], day: number | null) {
  if (day === null) return payables
  return payables.filter((p) => p.dueDay === day)
}

export function uniquePayDays(payables: Payable[]): number[] {
  const days = [...new Set(payables.map((p) => p.dueDay))]
  return days.sort((a, b) => a - b)
}

export function unpaidCount(payables: Payable[]) {
  return payables.filter((p) => !p.paid).length
}

export function forecastBalance(lines: BudgetLine[]) {
  const income = lines
    .filter((l) => l.label === 'Salário')
    .reduce((s, l) => s + l.amount, 0)
  const out = lines
    .filter((l) => l.label !== 'Salário')
    .reduce((s, l) => s + l.amount, 0)
  if (lines.some((l) => l.label === 'Sobra')) {
    return lines.find((l) => l.label === 'Sobra')!.amount
  }
  return income - out
}

export function budgetSegments(lines: BudgetLine[]) {
  const total = lines.reduce((s, l) => s + l.amount, 0)
  if (total <= 0) return []
  return lines.map((l) => ({
    ...l,
    pct: pct(l.amount, total),
  }))
}
