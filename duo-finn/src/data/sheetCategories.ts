export const SHEET_CATEGORY_OPTIONS = [
  { id: 'assinaturas', title: 'ASSINATURAS' },
  { id: 'casa', title: 'CASA' },
  { id: 'cartao', title: 'CARTÃO DE CRÉDITO' },
  { id: 'itens_cartao', title: 'ITENS DO CARTÃO' },
  { id: 'resumo_gastos', title: 'GASTOS' },
] as const

export type SheetCategoryId = (typeof SHEET_CATEGORY_OPTIONS)[number]['id']

export const DEFAULT_OVERVIEW_BLOCK_IDS: SheetCategoryId[] = ['casa', 'cartao']

export const BLOCK_COLORS: Record<string, string> = {
  assinaturas: '#c084fc',
  casa: '#60a5fa',
  cartao: '#a78bfa',
  itens_cartao: '#f472b6',
  resumo_gastos: '#fb923c',
  Salário: '#2d5bff',
  Sobra: '#22c55e',
}

export function isValidCategoryId(id: string): id is SheetCategoryId {
  return SHEET_CATEGORY_OPTIONS.some((c) => c.id === id)
}

export function categoryTitle(id: string, categories?: { id: string; title: string }[]) {
  const fromSheet = categories?.find((c) => c.id === id)?.title
  if (fromSheet) return fromSheet
  return SHEET_CATEGORY_OPTIONS.find((c) => c.id === id)?.title ?? id
}
