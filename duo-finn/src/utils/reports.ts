import type { MonthSheet } from '../data/types'
import { categoryTotal, monthCoreBalance, monthExpensesTotal, monthIncomeTotal } from './sheet'

const BAR_COLORS = ['#0f766e', '#334155', '#64748b', '#0e7490', '#57534e', '#1d4ed8']

export type ReportSlice = {
  label: string
  amount: number
  color: string
}

export type ReportMonth = {
  key: string
  label: string
  income: number
  spent: number
  invested: number
  balance: number
}

export type MonthReport = {
  months: ReportMonth[]
  income: number
  spent: number
  balance: number
  invested: number
  blocks: ReportSlice[]
  items: ReportSlice[]
}

function isInvestment(id: string, title: string) {
  return /invest/i.test(id) || /invest/i.test(title)
}

export function buildMonthReport(
  sheets: MonthSheet[],
  coreBlockIds: string[],
): MonthReport {
  const sorted = [...sheets].sort((a, b) => a.key.localeCompare(b.key))
  const blockTotals = new Map<string, number>()
  const itemTotals = new Map<string, { label: string; block: string; amount: number }>()
  let invested = 0

  const months: ReportMonth[] = sorted.map((sheet) => {
    let monthInvested = 0
    for (const category of sheet.categories) {
      const total = categoryTotal(category)
      if (total <= 0) continue
      const title = category.title.trim() || 'Bloco'
      blockTotals.set(title, (blockTotals.get(title) ?? 0) + total)
      if (isInvestment(category.id, title)) {
        monthInvested += total
        invested += total
      }
      for (const line of category.lines) {
        if (line.amount <= 0) continue
        const label = line.label.trim() || title
        const key = `${title}\n${label}`.toLocaleLowerCase('pt-BR')
        const current = itemTotals.get(key)
        if (current) current.amount += line.amount
        else itemTotals.set(key, { label, block: title, amount: line.amount })
      }
    }
    return {
      key: sheet.key,
      label: sheet.label,
      income: monthIncomeTotal(sheet),
      spent: monthExpensesTotal(sheet),
      invested: monthInvested,
      balance: monthCoreBalance(sheet, coreBlockIds),
    }
  })

  const blocks = [...blockTotals.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
    .map((block, index) => ({
      ...block,
      color: BAR_COLORS[index % BAR_COLORS.length]!,
    }))

  const repeatedLabels = new Set<string>()
  const seenLabels = new Set<string>()
  for (const item of itemTotals.values()) {
    const key = item.label.toLocaleLowerCase('pt-BR')
    if (seenLabels.has(key)) repeatedLabels.add(key)
    seenLabels.add(key)
  }

  const items = [...itemTotals.values()]
    .map((item) => ({
      label: repeatedLabels.has(item.label.toLocaleLowerCase('pt-BR'))
        ? `${item.label} · ${item.block}`
        : item.label,
      amount: item.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((item, index) => ({
      ...item,
      color: BAR_COLORS[index % BAR_COLORS.length]!,
    }))

  return {
    months,
    income: months.reduce((sum, month) => sum + month.income, 0),
    spent: months.reduce((sum, month) => sum + month.spent, 0),
    balance: months.reduce((sum, month) => sum + month.balance, 0),
    invested,
    blocks,
    items,
  }
}
