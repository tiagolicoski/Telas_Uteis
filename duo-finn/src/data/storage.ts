import { initialState } from './initialState'
import { migrateMonthSheet } from './migrateSheet'
import type { AppState, FinanceData, MonthSheet, NavId, UiState } from './types'

const REMOVED_NAV: NavId[] = ['cards', 'home', 'reserve', 'income', 'bills']

function normalizeNav(nav: NavId | undefined): NavId | undefined {
  if (nav && REMOVED_NAV.includes(nav)) return 'overview'
  return nav
}

const STORAGE_KEY = 'duo-finn-v2'

export function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY
}

const financeKeys: (keyof FinanceData)[] = [
  'houseBills',
  'payables',
  'cards',
  'moradiaItems',
  'budgetLines',
  'monthlySalary',
  'sheetMonths',
  'activeSheetMonthKey',
  'payablePaid',
  'overviewBlockIds',
]

export function loadState(userId?: string | null): AppState {
  return readStored(userId).state
}

export function readStored(userId?: string | null): { state: AppState; updatedAt: number } {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { state: { ...initialState }, updatedAt: 0 }
    const parsed = JSON.parse(raw) as Partial<
      FinanceData & Pick<UiState, 'theme' | 'nav' | 'profile' | 'sidebarCollapsed'>
    > & { updatedAt?: number }
    return {
      state: stateFromPayload(parsed),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
  } catch {
    return { state: { ...initialState }, updatedAt: 0 }
  }
}

export function stateFromPayload(
  parsed: Partial<FinanceData & Pick<UiState, 'theme' | 'nav' | 'profile' | 'sidebarCollapsed'>>,
): AppState {
  const finance = pickFinance(parsed)
  if (finance.sheetMonths?.length) {
    finance.sheetMonths = finance.sheetMonths.map((m) => migrateMonthSheet(m as MonthSheet))
  }
  return {
    ...initialState,
    ...finance,
    theme: parsed.theme ?? initialState.theme,
    nav: normalizeNav(parsed.nav as NavId | undefined) ?? initialState.nav,
    profile: parsed.profile ?? initialState.profile,
    sidebarCollapsed: parsed.sidebarCollapsed ?? initialState.sidebarCollapsed,
  }
}

export function scoreFinance(data: Pick<FinanceData, 'sheetMonths'>): number {
  let total = 0
  for (const month of data.sheetMonths ?? []) {
    total += month.netSalary || 0
    for (const extra of month.extraIncomes ?? []) total += extra.amount || 0
    for (const category of month.categories ?? []) {
      for (const line of category.lines ?? []) total += Math.abs(line.amount || 0)
    }
  }
  return total
}

export function financePayload(
  data: FinanceData & Pick<UiState, 'theme' | 'nav' | 'profile' | 'sidebarCollapsed'>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    theme: data.theme,
    nav: data.nav,
    profile: data.profile,
    sidebarCollapsed: data.sidebarCollapsed,
  }
  for (const key of financeKeys) {
    payload[key] = data[key]
  }
  return payload
}

export function saveFinance(
  data: FinanceData & Pick<UiState, 'theme' | 'nav' | 'profile' | 'sidebarCollapsed'>,
  updatedAt = Date.now(),
  userId?: string | null,
) {
  const payload = financePayload(data)
  payload.updatedAt = updatedAt
  localStorage.setItem(storageKey(userId), JSON.stringify(payload))
}

export function financeSlice(state: FinanceData): FinanceData {
  const out = {} as FinanceData
  for (const key of financeKeys) {
    ;(out as unknown as Record<string, unknown>)[key] = state[key]
  }
  return out
}

function pickFinance(parsed: Partial<FinanceData>): FinanceData {
  const out = {} as FinanceData
  for (const key of financeKeys) {
    if (parsed[key] !== undefined) {
      ;(out as unknown as Record<string, unknown>)[key] = parsed[key]
    } else {
      ;(out as unknown as Record<string, unknown>)[key] = initialState[key]
    }
  }
  return out
}
