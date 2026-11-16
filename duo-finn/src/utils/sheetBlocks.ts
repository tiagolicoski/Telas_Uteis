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

export type RestoreOffer = { id: string; title: string }

/** Blocos que este mês não tem e que ainda podem voltar. */
export function blocksToRestore(state: AppState, monthKey: string): RestoreOffer[] {
  const month = state.sheetMonths.find((m) => m.key === monthKey)
  const present = new Set(month?.categories.map((c) => c.id) ?? [])
  const hidden = new Set(state.hiddenRestoreIds ?? [])
  const offers = new Map<string, string>()

  const add = (id: string, title: string) => {
    if (!id || present.has(id) || hidden.has(id) || offers.has(id)) return
    offers.set(id, formatBlockTitle(title) || title)
  }

  for (const block of state.removedBlocks ?? []) add(block.id, block.title)
  for (const other of state.sheetMonths) {
    if (other.key === monthKey) continue
    for (const category of other.categories) add(category.id, category.title)
  }
  for (const preset of BUILTIN_CATEGORY_PRESETS) add(preset.id, preset.title)

  return [...offers.entries()].map(([id, title]) => ({ id, title }))
}

export function snapshotCategory(category: SheetCategory): SheetCategory {
  return {
    id: category.id,
    title: category.title,
    ...(category.inBills !== undefined ? { inBills: category.inBills } : {}),
    lines: category.lines.map((line) => ({ ...line })),
  }
}

export function categoryForRestore(state: AppState, categoryId: string): SheetCategory | null {
  const archived = (state.removedBlocks ?? []).find((block) => block.id === categoryId)
  if (archived) return snapshotCategory(archived)
  for (const month of state.sheetMonths) {
    const found = month.categories.find((category) => category.id === categoryId)
    if (found) return snapshotCategory(found)
  }
  return null
}

export function blockShowsInBills(
  category: { id: string; inBills?: boolean },
  overviewIds: Iterable<string>,
) {
  if (category.inBills === true) return true
  if (category.inBills === false) return false
  const ids = overviewIds instanceof Set ? overviewIds : new Set(overviewIds)
  return ids.has(category.id)
}

/** Nome de bloco no padrão da planilha: maiúsculas e um espaço entre palavras. */
export function formatBlockTitle(title: string) {
  const clean = title.trim().replace(/\s+/g, ' ')
  return clean ? clean.toLocaleUpperCase('pt-BR') : ''
}
