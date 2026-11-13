import type { MonthSheet } from '../data/types'
import { monthCoreBalance } from './sheet'

export type CashEvent = {
  day: number
  kind: 'in' | 'out'
  label: string
  amount: number
  balance: number
  paid: boolean
  /** O caixa das contas ainda não pagas ficou negativo nesta linha. */
  pressured: boolean
}

export type CashTiming = {
  events: CashEvent[]
  /** Maior valor que o caixa ficou negativo ao longo do mês. */
  shortfall: number
  shortfallDay: number | null
  /** Contas do saldo com valor, mas sem dia. */
  unscheduled: number
  missingSalaryDay: boolean
  missingExtraDay: boolean
  /** Sobra dos meses anteriores, já inclusa no primeiro saldo da lista. */
  carried: number
  carriedLabel: string | null
  /** Toda saída com dia já foi marcada como paga. */
  allSettled: boolean
}

type Draft = {
  day: number
  kind: 'in' | 'out'
  label: string
  amount: number
  paid?: boolean
}

export function carriedFromPreviousMonths(
  months: MonthSheet[],
  activeKey: string,
  coreBlockIds: string[],
): { amount: number; label: string } | null {
  const sorted = [...months].sort((a, b) => a.key.localeCompare(b.key))
  const index = sorted.findIndex((month) => month.key === activeKey)
  if (index <= 0) return null
  const amount = sorted
    .slice(0, index)
    .reduce((sum, month) => sum + monthCoreBalance(month, coreBlockIds), 0)
  if (Math.abs(amount) <= 0.009) return null
  const label =
    index === 1 ? `Saldo de ${sorted[0]!.label}` : 'Saldo dos meses anteriores'
  return { amount, label }
}

/** Simula o caixa do mês: entradas no dia marcado, saídas no vencimento. */
export function buildCashTiming(
  sheet: MonthSheet,
  coreBlockIds: string[],
  carried: { amount: number; label: string } | null = null,
  paidMap: Record<string, boolean> = {},
): CashTiming {
  const core = new Set(coreBlockIds)
  const drafts: Draft[] = []
  let unscheduled = 0

  if (sheet.netSalary > 0 && sheet.salaryDay) {
    drafts.push({
      day: sheet.salaryDay,
      kind: 'in',
      label: 'Salário',
      amount: sheet.netSalary,
    })
  }
  for (const extra of sheet.extraIncomes ?? []) {
    if (extra.amount > 0 && extra.day) {
      drafts.push({
        day: extra.day,
        kind: 'in',
        label: extra.label.trim() || 'Entrada extra',
        amount: extra.amount,
      })
    }
  }

  for (const category of sheet.categories) {
    if (!core.has(category.id)) continue
    for (const line of category.lines) {
      if (line.amount <= 0) continue
      if (!line.dueDay) {
        unscheduled += line.amount
        continue
      }
      drafts.push({
        day: line.dueDay,
        kind: 'out',
        label: line.label.trim() || category.title,
        amount: line.amount,
        paid: paidMap[`${sheet.key}:${category.id}:${line.id}`] === true,
      })
    }
  }

  if (carried && carried.amount > 0) {
    drafts.unshift({
      day: 0,
      kind: 'in',
      label: carried.label,
      amount: carried.amount,
    })
  } else if (carried && carried.amount < 0) {
    drafts.unshift({
      day: 0,
      kind: 'out',
      label: carried.label,
      amount: -carried.amount,
    })
  }

  drafts.sort((a, b) => a.day - b.day || (a.kind === 'in' ? -1 : 1))

  let balance = 0
  let open = 0
  let shortfall = 0
  let shortfallDay: number | null = null
  let scheduled = 0
  let settled = 0
  const events: CashEvent[] = drafts.map((event) => {
    const paid = event.kind === 'out' && event.paid === true
    if (event.kind === 'out' && event.day > 0) {
      scheduled += 1
      if (paid) settled += 1
    }
    const delta = event.kind === 'in' ? event.amount : -event.amount
    balance += delta
    if (!paid) open += delta
    if (open < -shortfall) {
      shortfall = -open
      shortfallDay = event.day
    }
    return { ...event, paid, balance, pressured: open < -0.009 }
  })

  return {
    events,
    shortfall,
    shortfallDay,
    unscheduled,
    missingSalaryDay: sheet.netSalary > 0 && !sheet.salaryDay,
    missingExtraDay: (sheet.extraIncomes ?? []).some((extra) => extra.amount > 0 && !extra.day),
    carried: carried?.amount ?? 0,
    carriedLabel: carried?.label ?? null,
    allSettled: scheduled > 0 && settled === scheduled,
  }
}

export type BalanceDrop = {
  previousLabel: string
  previousBalance: number
  drop: number
}

export function balanceDrop(
  months: MonthSheet[],
  activeKey: string,
  coreBlockIds: string[],
  currentBalance: number,
): BalanceDrop | null {
  const sorted = [...months].sort((a, b) => a.key.localeCompare(b.key))
  const index = sorted.findIndex((month) => month.key === activeKey)
  const previous = index > 0 ? sorted[index - 1] : undefined
  if (!previous) return null

  const previousBalance = monthCoreBalance(previous, coreBlockIds)

  const drop = previousBalance - currentBalance
  if (drop <= 0.009) return null
  return {
    previousLabel: previous.label,
    previousBalance,
    drop,
  }
}
