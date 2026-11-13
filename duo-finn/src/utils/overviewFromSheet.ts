import { BLOCK_COLORS, categoryTitle } from '../data/sheetCategories'
import type {
  BudgetLine,
  Card,
  HouseBill,
  MonthSheet,
  MoradiaItem,
  Payable,
  SheetCategory,
} from '../data/types'
import {
  categoryTotal,
  monthCoreBalance,
  monthCoreExpensesTotal,
  monthDetailExpensesTotal,
} from './sheet'

export type DetailLineItem = {
  id: string
  label: string
  amount: number
}

export type DetailBlock = {
  id: string
  title: string
  total: number
  lines: DetailLineItem[]
}

const MORADIA_ICONS: Record<string, string> = {
  aluguel: '🏠',
  condominio: '🏢',
  energia: '💡',
  ceee: '💡',
  mercado: '🛒',
  gasolina: '⛽',
  lanche: '🍔',
  uber: '🚗',
}

export function parseDueDay(label: string): number | null {
  const m = label.match(/dia\s*(\d{1,2})/i)
  if (!m) return null
  const d = parseInt(m[1], 10)
  return d >= 1 && d <= 31 ? d : null
}

function cat(sheet: MonthSheet, id: string): SheetCategory | undefined {
  return sheet.categories.find((c) => c.id === id)
}

function lineDueDay(
  line: { label: string; dueDay?: number | null },
  fallback: number,
): number {
  if (typeof line.dueDay === 'number' && line.dueDay >= 1 && line.dueDay <= 31) {
    return line.dueDay
  }
  return parseDueDay(line.label) ?? fallback
}

function payableId(monthKey: string, categoryId: string, lineId: string) {
  return `${monthKey}:${categoryId}:${lineId}`
}

export function buildPayablesFromSheet(
  sheet: MonthSheet,
  paidMap: Record<string, boolean>,
  coreBlockIds: string[],
): Payable[] {
  const set = new Set(coreBlockIds)
  const out: Payable[] = []

  for (const category of sheet.categories) {
    if (!set.has(category.id)) continue
    for (const line of category.lines) {
      if (line.amount <= 0) continue
      const id = payableId(sheet.key, category.id, line.id)
      out.push({
        id,
        name: line.label,
        amount: line.amount,
        dueDay: lineDueDay(line, 10),
        paid: paidMap[id] ?? false,
      })
    }
  }

  return out.sort((a, b) => a.dueDay - b.dueDay)
}

export function buildHouseBillsFromSheet(
  sheet: MonthSheet,
  coreBlockIds: string[],
): HouseBill[] {
  if (!coreBlockIds.includes('casa')) return []

  const casa = cat(sheet, 'casa')
  const bills: HouseBill[] = []

  if (casa) {
    for (const line of casa.lines) {
      if (line.amount <= 0) continue
      bills.push({
        id: `casa:${line.id}`,
        name: line.label,
        amount: line.amount,
        payer: 'you',
      })
    }
  }

  return bills
}

export function buildCardsFromSheet(
  sheet: MonthSheet,
  coreBlockIds: string[],
): Card[] {
  if (!coreBlockIds.includes('cartao')) return []

  const cartao = cat(sheet, 'cartao')
  if (!cartao) return []

  return cartao.lines
    .filter((l) => l.amount > 0)
    .map((line) => ({
      id: line.id,
      bank: line.label,
      tier: 'Fatura',
      amount: line.amount,
      limit: 0,
      dueDay: lineDueDay(line, 15),
      status: 'open' as const,
      color: line.label.toLowerCase().includes('ita') ? ('orange' as const) : ('dark' as const),
    }))
}

function iconForLabel(label: string): string {
  const lower = label.toLowerCase()
  for (const [key, icon] of Object.entries(MORADIA_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return '🏠'
}

export function buildMoradiaFromSheet(
  sheet: MonthSheet,
  coreBlockIds: string[],
): MoradiaItem[] {
  if (!coreBlockIds.includes('casa')) return []

  const items: MoradiaItem[] = []
  const casa = cat(sheet, 'casa')

  if (casa) {
    for (const line of casa.lines) {
      if (line.amount <= 0) continue
      const lower = line.label.toLowerCase()
      if (
        /aluguel|condominio|condomínio|energia|ceee|box|carro/i.test(lower)
      ) {
        items.push({
          id: `moradia-casa:${line.id}`,
          label: line.label,
          icon: iconForLabel(line.label),
          amount: line.amount,
        })
      }
    }
  }

  return items
}

export function buildBudgetFromSheet(
  sheet: MonthSheet,
  coreBlockIds: string[],
): BudgetLine[] {
  const lines: BudgetLine[] = []
  const sobra = monthCoreBalance(sheet, coreBlockIds)

  if (sheet.netSalary > 0) {
    lines.push({
      id: 'budget-salary',
      label: 'Salário',
      amount: sheet.netSalary,
      color: BLOCK_COLORS.Salário,
    })
  }
  for (const extra of sheet.extraIncomes ?? []) {
    if (extra.amount <= 0) continue
    lines.push({
      id: `budget-extra-${extra.id}`,
      label: extra.label.trim() || 'Entrada extra',
      amount: extra.amount,
      color: '#38bdf8',
    })
  }

  for (const id of coreBlockIds) {
    const category = cat(sheet, id)
    const tot = category ? categoryTotal(category) : 0
    if (tot <= 0) continue
    lines.push({
      id: `budget-${id}`,
      label: category?.title ?? categoryTitle(id),
      amount: tot,
      color: BLOCK_COLORS[id] ?? '#94a3b8',
    })
  }

  if (sobra !== 0 || lines.length > 0) {
    lines.push({
      id: 'budget-sobra',
      label: 'Sobra',
      amount: Math.max(0, sobra),
      color: BLOCK_COLORS.Sobra,
    })
  }

  return lines
}

export function buildDetailBlocks(
  sheet: MonthSheet,
  coreBlockIds: string[],
): DetailBlock[] {
  const set = new Set(coreBlockIds)
  return sheet.categories
    .filter((c) => !set.has(c.id))
    .map((category) => ({
      id: category.id,
      title: category.title,
      total: categoryTotal(category),
      lines: category.lines.map((l) => ({
        id: l.id,
        label: l.label,
        amount: l.amount,
      })),
    }))
}

export type OverviewFromSheet = {
  houseBills: HouseBill[]
  payables: Payable[]
  cards: Card[]
  moradiaItems: MoradiaItem[]
  budgetLines: BudgetLine[]
  detailBlocks: DetailBlock[]
  monthlySalary: number
  coreExpensesTotal: number
  detailExpensesTotal: number
  balance: number
  sheetLabel: string
  showCartoes: boolean
  showMoradia: boolean
  coreBlockLabels: string[]
}

export function overviewFromSheet(
  sheet: MonthSheet | undefined,
  paidMap: Record<string, boolean>,
  coreBlockIds: string[],
): OverviewFromSheet | null {
  if (!sheet) return null

  return {
    houseBills: buildHouseBillsFromSheet(sheet, coreBlockIds),
    payables: buildPayablesFromSheet(sheet, paidMap, coreBlockIds),
    cards: buildCardsFromSheet(sheet, coreBlockIds),
    moradiaItems: buildMoradiaFromSheet(sheet, coreBlockIds),
    budgetLines: buildBudgetFromSheet(sheet, coreBlockIds),
    detailBlocks: buildDetailBlocks(sheet, coreBlockIds),
    monthlySalary: sheet.netSalary,
    coreExpensesTotal: monthCoreExpensesTotal(sheet, coreBlockIds),
    detailExpensesTotal: monthDetailExpensesTotal(sheet, coreBlockIds),
    balance: monthCoreBalance(sheet, coreBlockIds),
    sheetLabel: sheet.label,
    showCartoes: coreBlockIds.includes('cartao'),
    showMoradia: coreBlockIds.includes('casa'),
    coreBlockLabels: coreBlockIds.map(
      (id) => cat(sheet, id)?.title ?? categoryTitle(id),
    ),
  }
}
