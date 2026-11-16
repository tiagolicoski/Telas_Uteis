import { initialState } from '../data/initialState'
import type {
  AddEntryPayload,
  AddKind,
  AppState,
  BudgetLine,
  Card,
  HouseBill,
  MoradiaItem,
  FinanceData,
  NavId,
  Payable,
  Theme,
} from '../data/types'
import {
  categoryFromPreset,
  cloneMonthSheetFromSource,
  createMonthSheet,
  monthKeyToLabel,
} from '../data/sheetTemplate'
import { newId } from '../utils/format'
import {
  blockShowsInBills,
  categoryExistsInAnyMonth,
  categoryForRestore,
  formatBlockTitle,
  mapAllSheetCategories,
  partitionOverviewCategories,
  snapshotCategory,
} from '../utils/sheetBlocks'

function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map((n) => parseInt(n, 10))
  const d = new Date(y, m - 1, 1)
  d.setMonth(d.getMonth() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function edgeMonthKey(months: { key: string }[], edge: 'first' | 'last'): string | null {
  if (months.length === 0) return null
  const sorted = [...months].sort((a, b) => a.key.localeCompare(b.key))
  return edge === 'first' ? sorted[0]!.key : sorted[sorted.length - 1]!.key
}

function nextMonthKey(months: { key: string }[]): string {
  const last = edgeMonthKey(months, 'last')
  if (!last) {
    return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  }
  return shiftMonthKey(last, 1)
}

function prevMonthKey(months: { key: string }[]): string {
  const first = edgeMonthKey(months, 'first')
  if (!first) {
    return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  }
  return shiftMonthKey(first, -1)
}

function mapMonth(
  state: AppState,
  monthKey: string,
  fn: (m: import('../data/types').MonthSheet) => import('../data/types').MonthSheet,
): AppState {
  return {
    ...state,
    sheetMonths: state.sheetMonths.map((m) => (m.key === monthKey ? fn(m) : m)),
  }
}

export type FinanceAction =
  | { type: 'SET_NAV'; nav: NavId }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_SIDEBAR_COLLAPSED' }
  | { type: 'SET_PROFILE'; profile: import('../data/types').Profile }
  | { type: 'SET_PAY_DAY'; day: number | null }
  | { type: 'TOGGLE_PAYABLE'; id: string }
  | { type: 'NEXT_CARD' }
  | { type: 'PREV_CARD' }
  | { type: 'SET_ADD_MODAL'; open: boolean }
  | { type: 'CYCLE_MONTH' }
  | { type: 'ADD_ENTRY'; kind: AddKind; payload: AddEntryPayload }
  | { type: 'SET_SHEET_MONTH'; key: string }
  | { type: 'HYDRATE_FINANCE'; finance: FinanceData }
  | { type: 'ADD_SHEET_MONTH' }
  | { type: 'ADD_PREV_SHEET_MONTH' }
  | { type: 'REMOVE_SHEET_MONTH'; key: string }
  | {
      type: 'UPDATE_SHEET_HEADER'
      monthKey: string
      field: 'netSalary' | 'salaryDay'
      value: string | number | null
    }
  | {
      type: 'UPDATE_EXTRA_INCOME'
      monthKey: string
      id: string
      field: 'label' | 'amount' | 'day'
      value: string | number | null
    }
  | { type: 'ADD_EXTRA_INCOME'; monthKey: string }
  | { type: 'REMOVE_EXTRA_INCOME'; monthKey: string; id: string }
  | {
      type: 'UPDATE_SHEET_LINE'
      monthKey: string
      categoryId: string
      lineId: string
      label?: string
      amount?: number
      dueDay?: number | null
    }
  | { type: 'ADD_SHEET_LINE'; monthKey: string; categoryId: string; label: string }
  | {
      type: 'REMOVE_SHEET_LINE'
      monthKey: string
      categoryId: string
      lineId: string
    }
  | { type: 'TOGGLE_OVERVIEW_BLOCK'; categoryId: string }
  | { type: 'TOGGLE_BILLS_BLOCK'; monthKey: string; categoryId: string }
  | { type: 'MOVE_SHEET_BLOCK'; monthKey: string; categoryId: string; direction: 'left' | 'right' }
  | { type: 'ADD_SHEET_BLOCK'; monthKey: string; title: string }
  | { type: 'REMOVE_SHEET_BLOCK'; monthKey: string; categoryId: string }
  | { type: 'RESTORE_SHEET_BLOCK'; monthKey: string; categoryId: string }
  | { type: 'DISMISS_RESTORE_BLOCK'; categoryId: string }
  | { type: 'UPDATE_SHEET_CATEGORY_TITLE'; monthKey: string; categoryId: string; title: string }

const BUDGET_PRESETS: Record<string, string> = {
  Salário: '#2d5bff',
  'Sua metade da casa': '#60a5fa',
  'Contas pessoais': '#a78bfa',
  'Dia a dia': '#f472b6',
  Sobra: '#22c55e',
}

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function financeReducer(state: AppState, action: FinanceAction): AppState {
  switch (action.type) {
    case 'SET_NAV':
      return { ...state, nav: action.nav }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    case 'TOGGLE_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_PROFILE':
      return { ...state, profile: action.profile }
    case 'SET_PAY_DAY':
      return { ...state, selectedPayDay: action.day }
    case 'TOGGLE_PAYABLE': {
      const current = state.payablePaid[action.id] ?? false
      return {
        ...state,
        payablePaid: { ...state.payablePaid, [action.id]: !current },
      }
    }
    case 'NEXT_CARD':
      if (state.cards.length === 0) return state
      return {
        ...state,
        activeCardIndex: (state.activeCardIndex + 1) % state.cards.length,
      }
    case 'PREV_CARD':
      if (state.cards.length === 0) return state
      return {
        ...state,
        activeCardIndex:
          (state.activeCardIndex - 1 + state.cards.length) % state.cards.length,
      }
    case 'SET_ADD_MODAL':
      return { ...state, addModalOpen: action.open }
    case 'CYCLE_MONTH': {
      const match = state.monthLabel.match(/^(\w+)\s+(\d{4})$/)
      const year = match ? parseInt(match[2], 10) : 2026
      const currentName = match ? match[1] : 'Dezembro'
      const idx = months.findIndex((m) => m === currentName)
      const nextIdx = (idx + 1) % months.length
      const nextYear = nextIdx === 0 ? year + 1 : year
      return { ...state, monthLabel: `${months[nextIdx]} ${nextYear}` }
    }
    case 'ADD_ENTRY':
      return applyAdd(state, action.kind, action.payload)
    case 'HYDRATE_FINANCE': {
      const label = monthKeyToLabel(action.finance.activeSheetMonthKey)
      const [monthName, year] = label.split('/')
      return {
        ...state,
        ...action.finance,
        monthLabel: monthName && year ? `${monthName} ${year}` : state.monthLabel,
      }
    }
    case 'SET_SHEET_MONTH': {
      const label = monthKeyToLabel(action.key)
      const [monthName, year] = label.split('/')
      return {
        ...state,
        activeSheetMonthKey: action.key,
        monthLabel: `${monthName} ${year}`,
      }
    }
    case 'ADD_SHEET_MONTH':
      return insertSheetMonth(state, nextMonthKey(state.sheetMonths))
    case 'ADD_PREV_SHEET_MONTH':
      return insertSheetMonth(state, prevMonthKey(state.sheetMonths))
    case 'REMOVE_SHEET_MONTH': {
      if (state.sheetMonths.length <= 1) return state
      const filtered = state.sheetMonths.filter((m) => m.key !== action.key)
      if (filtered.length === state.sheetMonths.length) return state

      const sortedBefore = [...state.sheetMonths].sort((a, b) =>
        a.key.localeCompare(b.key),
      )
      const removeIdx = sortedBefore.findIndex((m) => m.key === action.key)
      let nextKey = state.activeSheetMonthKey
      if (action.key === state.activeSheetMonthKey) {
        const neighbor =
          sortedBefore[removeIdx - 1] ?? sortedBefore[removeIdx + 1]
        nextKey = neighbor?.key ?? filtered[0]!.key
      }
      if (!filtered.some((m) => m.key === nextKey)) {
        nextKey = filtered[0]!.key
      }

      const label = monthKeyToLabel(nextKey)
      const [monthName, year] = label.split('/')
      return {
        ...state,
        sheetMonths: filtered,
        activeSheetMonthKey: nextKey,
        monthLabel: `${monthName} ${year}`,
      }
    }
    case 'UPDATE_SHEET_HEADER': {
      const patched = mapMonth(state, action.monthKey, (m) => ({
        ...m,
        [action.field]: action.value,
      }))
      if (action.field === 'netSalary' && typeof action.value === 'number') {
        return { ...patched, monthlySalary: action.value }
      }
      return patched
    }
    case 'UPDATE_EXTRA_INCOME':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        extraIncomes: (m.extraIncomes ?? []).map((item) =>
          item.id !== action.id ? item : { ...item, [action.field]: action.value },
        ),
      }))
    case 'ADD_EXTRA_INCOME':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        extraIncomes: [
          ...(m.extraIncomes ?? []),
          { id: newId(), label: '', amount: 0, day: null },
        ],
      }))
    case 'REMOVE_EXTRA_INCOME':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        extraIncomes: (m.extraIncomes ?? []).filter((item) => item.id !== action.id),
      }))
    case 'UPDATE_SHEET_LINE':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                lines: c.lines.map((l) =>
                  l.id !== action.lineId
                    ? l
                    : {
                        ...l,
                        ...(action.label !== undefined ? { label: action.label } : {}),
                        ...(action.amount !== undefined ? { amount: action.amount } : {}),
                        ...(action.dueDay !== undefined ? { dueDay: action.dueDay } : {}),
                      },
                ),
              },
        ),
      }))
    case 'ADD_SHEET_LINE':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                lines: [
                  ...c.lines,
                  {
                    id: newId(),
                    label: action.label.trim() || 'Novo item',
                    amount: 0,
                    dueDay: null,
                  },
                ],
              },
        ),
      }))
    case 'REMOVE_SHEET_LINE':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.map((c) =>
          c.id !== action.categoryId
            ? c
            : { ...c, lines: c.lines.filter((l) => l.id !== action.lineId) },
        ),
      }))
    case 'TOGGLE_OVERVIEW_BLOCK': {
      if (!categoryExistsInAnyMonth(state, action.categoryId)) return state
      const has = state.overviewBlockIds.includes(action.categoryId)
      const overviewBlockIds = has
        ? state.overviewBlockIds.filter((id) => id !== action.categoryId)
        : [...state.overviewBlockIds, action.categoryId]
      const regrouped = mapAllSheetCategories(state, (categories) =>
        partitionOverviewCategories(categories, overviewBlockIds),
      )
      return { ...regrouped, overviewBlockIds }
    }
    case 'TOGGLE_BILLS_BLOCK':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.map((c) =>
          c.id !== action.categoryId
            ? c
            : {
                ...c,
                inBills: !blockShowsInBills(c, state.overviewBlockIds),
              },
        ),
      }))
    case 'MOVE_SHEET_BLOCK':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: moveBlock(m.categories, action.categoryId, action.direction, state.overviewBlockIds),
      }))
    case 'ADD_SHEET_BLOCK': {
      const title = formatBlockTitle(action.title)
      if (!title) return state
      const id = `custom_${newId()}`
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: [
          ...m.categories,
          {
            id,
            title,
            inBills: false,
            lines: [{ id: newId(), label: 'Novo item', amount: 0, dueDay: null }],
          },
        ],
      }))
    }
    case 'REMOVE_SHEET_BLOCK': {
      const month = getSheetMonth(state, action.monthKey)
      if (!month || month.categories.length <= 1) return state
      const removed = month.categories.find((c) => c.id === action.categoryId)
      if (!removed) return state
      const next = mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.filter((c) => c.id !== action.categoryId),
      }))
      const hidden = new Set(state.hiddenRestoreIds ?? [])
      const removedBlocks = hidden.has(removed.id)
        ? (state.removedBlocks ?? [])
        : upsertRemovedBlock(state.removedBlocks ?? [], snapshotCategory(removed))
      if (categoryExistsInAnyMonth(next, action.categoryId)) {
        return { ...next, removedBlocks }
      }
      return {
        ...next,
        removedBlocks,
        overviewBlockIds: next.overviewBlockIds.filter((id) => id !== action.categoryId),
      }
    }
    case 'RESTORE_SHEET_BLOCK': {
      const month = getSheetMonth(state, action.monthKey)
      if (!month || month.categories.some((c) => c.id === action.categoryId)) return state
      const source = categoryForRestore(state, action.categoryId) ?? categoryFromPreset(action.categoryId)
      if (!source) return state
      const restored = {
        ...source,
        lines: source.lines.map((line) => ({ ...line, id: newId() })),
      }
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: [...m.categories, restored],
      }))
    }
    case 'DISMISS_RESTORE_BLOCK': {
      if ((state.hiddenRestoreIds ?? []).includes(action.categoryId)) return state
      return {
        ...state,
        hiddenRestoreIds: [...(state.hiddenRestoreIds ?? []), action.categoryId],
        removedBlocks: (state.removedBlocks ?? []).filter((block) => block.id !== action.categoryId),
      }
    }
    case 'UPDATE_SHEET_CATEGORY_TITLE':
      return mapMonth(state, action.monthKey, (m) => ({
        ...m,
        categories: m.categories.map((c) =>
          c.id === action.categoryId
            ? { ...c, title: formatBlockTitle(action.title) || c.title }
            : c,
        ),
      }))
    default:
      return state
  }
}

function upsertRemovedBlock(
  blocks: import('../data/types').SheetCategory[],
  block: import('../data/types').SheetCategory,
) {
  return [...blocks.filter((item) => item.id !== block.id), block]
}

function moveBlock(
  categories: import('../data/types').SheetCategory[],
  categoryId: string,
  direction: 'left' | 'right',
  overviewIds: string[],
) {
  const idx = categories.findIndex((c) => c.id === categoryId)
  if (idx < 0) return categories
  const inSaldo = new Set(overviewIds)
  const currentIn = inSaldo.has(categories[idx]!.id)
  const step = direction === 'left' ? -1 : 1
  let target = idx + step
  while (target >= 0 && target < categories.length) {
    if (inSaldo.has(categories[target]!.id) === currentIn) break
    target += step
  }
  if (target < 0 || target >= categories.length) return categories
  const next = [...categories]
  const [item] = next.splice(idx, 1)
  const insertAt = next.findIndex((c) => c.id === categories[target]!.id)
  const at = direction === 'right' ? insertAt + 1 : insertAt
  next.splice(at, 0, item!)
  return next
}

function getSheetMonth(state: AppState, key: string) {
  return state.sheetMonths.find((m) => m.key === key)
}

function insertSheetMonth(state: AppState, key: string): AppState {
  if (state.sheetMonths.some((m) => m.key === key)) return state
  const label = monthKeyToLabel(key)
  const source =
    getSheetMonth(state, state.activeSheetMonthKey) ??
    state.sheetMonths[state.sheetMonths.length - 1]
  const sheet = source
    ? cloneMonthSheetFromSource(source, key, label)
    : createMonthSheet(key, label)
  const [monthName, year] = label.split('/')
  return {
    ...state,
    sheetMonths: [...state.sheetMonths, sheet],
    activeSheetMonthKey: key,
    monthLabel: `${monthName} ${year}`,
  }
}

function applyAdd(state: AppState, kind: AddKind, payload: AddEntryPayload): AppState {
  const { name, amount, dueDay, payer, icon, bank, limit, budgetLabel, cardId, salary } =
    payload

  switch (kind) {
    case 'payable': {
      const item: Payable = {
        id: newId(),
        name: name.trim() || 'Conta',
        amount,
        dueDay: dueDay ?? 5,
        paid: false,
      }
      const payables = [...state.payables, item]
      const days = [...new Set(payables.map((p) => p.dueDay))].sort((a, b) => a - b)
      const selectedPayDay =
        state.selectedPayDay === null ? (days[0] ?? null) : state.selectedPayDay
      return { ...state, payables, selectedPayDay, addModalOpen: false }
    }
    case 'houseBill': {
      const item: HouseBill = {
        id: newId(),
        name: name.trim() || 'Conta da casa',
        amount,
        payer: payer ?? 'you',
      }
      return {
        ...state,
        houseBills: [...state.houseBills, item],
        addModalOpen: false,
      }
    }
    case 'moradia': {
      const item: MoradiaItem = {
        id: newId(),
        label: name.trim() || 'Item',
        icon: icon ?? '🏠',
        amount,
      }
      return {
        ...state,
        moradiaItems: [...state.moradiaItems, item],
        addModalOpen: false,
      }
    }
    case 'cardExpense': {
      if (state.cards.length === 0) return state
      const idx = cardId
        ? state.cards.findIndex((c) => c.id === cardId)
        : state.activeCardIndex
      if (idx < 0) return state
      const cards = state.cards.map((c, i) =>
        i === idx ? { ...c, amount: c.amount + amount } : c,
      )
      return { ...state, cards, addModalOpen: false }
    }
    case 'newCard': {
      const card: Card = {
        id: newId(),
        bank: bank?.trim() || name.trim() || 'Cartão',
        tier: 'UNIQUE',
        amount: amount,
        limit: limit ?? 0,
        dueDay: dueDay ?? 15,
        status: 'open',
        color: bank?.toLowerCase().includes('ita') ? 'orange' : 'dark',
      }
      return {
        ...state,
        cards: [...state.cards, card],
        activeCardIndex: state.cards.length,
        addModalOpen: false,
      }
    }
    case 'budget': {
      const label = budgetLabel ?? 'Dia a dia'
      const line: BudgetLine = {
        id: newId(),
        label,
        amount,
        color: BUDGET_PRESETS[label] ?? '#94a3b8',
      }
      const budgetLines = upsertBudgetLine([...state.budgetLines], line)
      const monthlySalary =
        label === 'Salário' && salary !== undefined
          ? salary
          : label === 'Salário'
            ? amount
            : state.monthlySalary
      return { ...state, budgetLines, monthlySalary, addModalOpen: false }
    }
    default:
      return state
  }
}

function upsertBudgetLine(lines: BudgetLine[], incoming: BudgetLine): BudgetLine[] {
  const idx = lines.findIndex((l) => l.label === incoming.label)
  if (idx >= 0) {
    const next = [...lines]
    next[idx] = { ...next[idx], amount: next[idx].amount + incoming.amount }
    return next
  }
  return [...lines, incoming]
}

export { initialState }
