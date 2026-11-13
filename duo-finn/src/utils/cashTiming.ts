import type { MonthSheet } from '../data/types'
import { monthCoreBalance } from './sheet'

export type CashEvent = {
  day: number
  kind: 'in' | 'out'
  label: string
  amount: number
  balance: number
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
}

type Draft = { day: number; kind: 'in' | 'out'; label: string; amount: number }

/** Simula o caixa do mês: entradas no dia marcado, saídas no vencimento. */
export function buildCashTiming(
  sheet: MonthSheet,
  coreBlockIds: string[],
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
  if (sheet.extraIncomeAmount > 0 && sheet.extraIncomeDay) {
    drafts.push({
      day: sheet.extraIncomeDay,
      kind: 'in',
      label: sheet.extraIncomeLabel.trim() || 'Entrada extra',
      amount: sheet.extraIncomeAmount,
    })
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
      })
    }
  }

  drafts.sort((a, b) => a.day - b.day || (a.kind === 'in' ? -1 : 1))

  let balance = 0
  let shortfall = 0
  let shortfallDay: number | null = null
  const events: CashEvent[] = drafts.map((event) => {
    balance += event.kind === 'in' ? event.amount : -event.amount
    if (balance < -shortfall) {
      shortfall = -balance
      shortfallDay = event.day
    }
    return { ...event, balance }
  })

  return {
    events,
    shortfall,
    shortfallDay,
    unscheduled,
    missingSalaryDay: sheet.netSalary > 0 && !sheet.salaryDay,
    missingExtraDay: sheet.extraIncomeAmount > 0 && !sheet.extraIncomeDay,
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
