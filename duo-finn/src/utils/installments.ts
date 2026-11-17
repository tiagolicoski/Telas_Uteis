import { monthKeyToLabel } from '../data/sheetTemplate'
import type { InstallmentPurchase } from '../data/types'
import { currentMonthKey } from './overviewFromSheet'

export type InstallmentSlot = {
  purchaseId: string
  label: string
  cardLabel: string
  number: number
  count: number
  amount: number
  monthKey: string
}

export type InstallmentMonth = {
  key: string
  label: string
  total: number
  slots: InstallmentSlot[]
}

export function shiftMonthKey(key: string, delta: number): string {
  const [year, month] = key.split('-').map((part) => parseInt(part, 10))
  const date = new Date(year, month - 1, 1)
  date.setMonth(date.getMonth() + delta)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function purchaseTotal(purchase: InstallmentPurchase): number {
  const count = Math.min(48, Math.max(1, Math.round(purchase.count)))
  if (purchase.purchaseAmount != null && Number.isFinite(purchase.purchaseAmount)) {
    return purchase.purchaseAmount
  }
  return purchase.installmentAmount * count
}

/** Divide o total em parcelas de centavos. A última parcela fica com o resto. */
export function splitPurchase(total: number, count: number): number[] {
  const safeCount = Math.min(48, Math.max(1, Math.round(count)))
  const cents = Math.max(0, Math.round(total * 100))
  const base = Math.floor(cents / safeCount)
  const remainder = cents - base * safeCount
  return Array.from({ length: safeCount }, (_, index) => {
    const extra = index === safeCount - 1 ? remainder : 0
    return (base + extra) / 100
  })
}

export function purchaseSlots(purchase: InstallmentPurchase): InstallmentSlot[] {
  const amounts = splitPurchase(purchaseTotal(purchase), purchase.count)
  return amounts.map((amount, index) => ({
    purchaseId: purchase.id,
    label: purchase.label,
    cardLabel: purchase.cardLabel,
    number: index + 1,
    count: amounts.length,
    amount,
    monthKey: shiftMonthKey(purchase.startKey, index),
  }))
}

export function installmentProgress(purchase: InstallmentPurchase, today = new Date()) {
  const todayKey = currentMonthKey(today)
  const slots = purchaseSlots(purchase)
  const passed = slots.filter((slot) => slot.monthKey < todayKey).length
  const remainingSlots = slots.filter((slot) => slot.monthKey >= todayKey)
  return {
    passed,
    remaining: slots.length - passed,
    total: slots.reduce((sum, slot) => sum + slot.amount, 0),
    remainingAmount: remainingSlots.reduce((sum, slot) => sum + slot.amount, 0),
  }
}

export type InstallmentScope =
  | { kind: 'all' }
  | { kind: 'year'; year: string }
  | { kind: 'month'; key: string }

export type InstallmentCardTotal = {
  label: string
  period: number
  remaining: number
}

export function summarizeInstallments(
  purchases: InstallmentPurchase[],
  scope: InstallmentScope,
  today = new Date(),
) {
  const todayKey = currentMonthKey(today)
  const slots = purchases.flatMap(purchaseSlots)
  const inPeriod = (monthKey: string) => {
    if (scope.kind === 'all') return true
    if (scope.kind === 'year') return monthKey.startsWith(scope.year)
    return monthKey === scope.key
  }
  const byCard = new Map<string, InstallmentCardTotal>()
  let periodTotal = 0
  let remainingAmount = 0
  for (const slot of slots) {
    const label = slot.cardLabel.trim() || 'Sem cartão'
    const row = byCard.get(label) ?? { label, period: 0, remaining: 0 }
    if (inPeriod(slot.monthKey)) {
      row.period += slot.amount
      periodTotal += slot.amount
    }
    if (slot.monthKey >= todayKey) {
      row.remaining += slot.amount
      remainingAmount += slot.amount
    }
    byCard.set(label, row)
  }
  const openCount = purchases.filter(
    (purchase) => installmentProgress(purchase, today).remaining > 0,
  ).length
  return {
    periodTotal,
    remainingAmount,
    purchaseCount: purchases.length,
    openCount,
    byCard: [...byCard.values()]
      .filter((row) => row.period > 0 || row.remaining > 0)
      .sort((a, b) => b.period - a.period || b.remaining - a.remaining),
  }
}

export function agendaByMonth(purchases: InstallmentPurchase[]): InstallmentMonth[] {
  const groups = new Map<string, InstallmentSlot[]>()
  for (const purchase of purchases) {
    for (const slot of purchaseSlots(purchase)) {
      const list = groups.get(slot.monthKey) ?? []
      list.push(slot)
      groups.set(slot.monthKey, list)
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, slots]) => ({
      key,
      label: monthKeyToLabel(key),
      total: slots.reduce((sum, slot) => sum + slot.amount, 0),
      slots: slots.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    }))
}
