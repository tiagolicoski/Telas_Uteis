import type { MonthSheet, SheetCategory } from '../data/types'

export function categoryTotal(cat: SheetCategory): number {
  return cat.lines.reduce((s, l) => s + l.amount, 0)
}

export function monthExpensesTotal(sheet: MonthSheet): number {
  return sheet.categories.reduce((s, c) => s + categoryTotal(c), 0)
}

export function monthCoreExpensesTotal(
  sheet: MonthSheet,
  coreBlockIds: string[],
): number {
  const set = new Set(coreBlockIds)
  return sheet.categories
    .filter((c) => set.has(c.id))
    .reduce((s, c) => s + categoryTotal(c), 0)
}

export function monthDetailExpensesTotal(
  sheet: MonthSheet,
  coreBlockIds: string[],
): number {
  const set = new Set(coreBlockIds)
  return sheet.categories
    .filter((c) => !set.has(c.id))
    .reduce((s, c) => s + categoryTotal(c), 0)
}

export function monthIncomeTotal(sheet: MonthSheet): number {
  const extra = (sheet.extraIncomes ?? []).reduce((sum, item) => sum + (item.amount || 0), 0)
  return sheet.netSalary + extra
}

export function monthCoreBalance(
  sheet: MonthSheet,
  coreBlockIds: string[],
): number {
  return monthIncomeTotal(sheet) - monthCoreExpensesTotal(sheet, coreBlockIds)
}

export function monthBalance(
  sheet: MonthSheet,
  coreBlockIds: string[],
): number {
  return monthCoreBalance(sheet, coreBlockIds)
}

export function getSheetMonth(
  months: MonthSheet[],
  key: string,
): MonthSheet | undefined {
  return months.find((m) => m.key === key)
}
