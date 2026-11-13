import type { ExtraIncome, MonthSheet, SheetCategory, SheetLine } from './types'
import { parseDueDay } from '../utils/overviewFromSheet'

function migrateLine(line: SheetLine): SheetLine {
  if (line.dueDay === null) return { ...line, dueDay: null }
  if (
    typeof line.dueDay === 'number' &&
    line.dueDay >= 1 &&
    line.dueDay <= 31
  ) {
    return line
  }
  return { ...line, dueDay: parseDueDay(line.label) }
}

function dayOrNull(value: unknown): number | null {
  return typeof value === 'number' && value >= 1 && value <= 31 ? value : null
}

function migrateCategories(categories: SheetCategory[]): SheetCategory[] {
  return categories.map((category) => ({
    ...category,
    lines: category.lines.map(migrateLine),
  }))
}

type LegacyExtra = {
  id?: string
  label?: string
  amount?: number
  day?: unknown
}

type LegacyMonth = {
  key: string
  label: string
  netSalary?: number
  salaryDay?: unknown
  extraIncomes?: LegacyExtra[]
  extraIncomeLabel?: string
  extraIncomeAmount?: number
  extraIncomeDay?: unknown
  categories?: SheetCategory[]
  sharedLabel?: string
  sharedAmountA?: number
  sharedAmountB?: number
}

function migrateExtras(raw: LegacyMonth): ExtraIncome[] {
  if (Array.isArray(raw.extraIncomes)) {
    return raw.extraIncomes.map((item, index) => ({
      id: item.id || `${raw.key}-extra-${index}`,
      label: item.label ?? '',
      amount: typeof item.amount === 'number' ? item.amount : 0,
      day: dayOrNull(item.day),
    }))
  }

  let label = raw.extraIncomeLabel ?? ''
  let amount = raw.extraIncomeAmount ?? 0
  if (typeof raw.sharedAmountA === 'number' && raw.sharedAmountA > 0 && !amount) {
    amount = raw.sharedAmountA
    label =
      raw.sharedLabel && raw.sharedLabel !== 'Marcele — Aluguel'
        ? raw.sharedLabel
        : (raw.sharedLabel ?? label)
  } else if (!label && raw.sharedLabel && raw.sharedLabel !== 'Marcele — Aluguel') {
    label = raw.sharedLabel
  }
  const day = dayOrNull(raw.extraIncomeDay)
  if (!label && amount <= 0 && day == null) return []
  return [{ id: `${raw.key}-extra`, label, amount, day }]
}

export function migrateMonthSheet(raw: LegacyMonth): MonthSheet {
  return {
    key: raw.key,
    label: raw.label,
    netSalary: raw.netSalary ?? 0,
    salaryDay: dayOrNull(raw.salaryDay),
    extraIncomes: migrateExtras(raw),
    categories: migrateCategories(raw.categories ?? []),
  }
}
