import type { AppState, SheetCategory } from '../data/types'
import { BUILTIN_CATEGORY_PRESETS } from '../data/sheetTemplate'

/** Blocos do saldo primeiro, na ordem relativa atual; o restante depois. */
export function partitionOverviewCategories(
  categories: SheetCategory[],
  overviewIds: Iterable<string>,
): SheetCategory[] {
  const set = new Set(overviewIds)
  const inSaldo: SheetCategory[] = []
  const outSaldo: SheetCategory[] = []
  for (const category of categories) {
    if (set.has(category.id)) inSaldo.push(category)
    else outSaldo.push(category)
  }
  return [...inSaldo, ...outSaldo]
}

export function mapAllSheetCategories(
  state: AppState,
  fn: (categories: SheetCategory[]) => SheetCategory[],
): AppState {
  return {
    ...state,
    sheetMonths: state.sheetMonths.map((m) => ({
      ...m,
      categories: fn(m.categories),
    })),
  }
}

export function categoryExistsInAnyMonth(state: AppState, categoryId: string) {
  return state.sheetMonths.some((m) => m.categories.some((c) => c.id === categoryId))
}

export function missingBuiltinPresets(state: AppState): typeof BUILTIN_CATEGORY_PRESETS {
  const present = new Set(
    state.sheetMonths[0]?.categories.map((c) => c.id) ?? [],
  )
  return BUILTIN_CATEGORY_PRESETS.filter((p) => !present.has(p.id))
}
