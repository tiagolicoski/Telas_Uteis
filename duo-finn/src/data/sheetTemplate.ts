import type { MonthSheet, SheetCategory, SheetLine } from './types'
import { newId } from '../utils/format'

export type CategoryPreset = { id: string; title: string; items: string[] }

export const BUILTIN_CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'assinaturas',
    title: 'ASSINATURAS',
    items: [
      'MELI',
      'AMAZON PRIME',
      'SPOTIFY',
      'VIVO/celular',
      'Seguro de vida/prudent',
      'CURSOR',
      'Vivo/internet',
    ],
  },
  {
    id: 'casa',
    title: 'CASA',
    items: [
      'EMPRESTIMO CARRO',
      'Box/Carro dia 5',
      'Aluguel/apto dia 9',
      'CEEE/Energia',
      'Aluguel/apto condominio',
    ],
  },
  {
    id: 'cartao',
    title: 'CARTÃO DE CRÉDITO',
    items: [
      'MercadoPago',
      'Nubank',
      'PLANO SAÚDE/IPI',
      'Renner',
      'Bradesco Crédito',
    ],
  },
  {
    id: 'itens_cartao',
    title: 'ITENS DO CARTÃO',
    items: ['UBER', 'MERCADO'],
  },
  {
    id: 'resumo_gastos',
    title: 'GASTOS',
    items: ['MERCADO', 'GASOLINA', 'LANCHE', 'UBER'],
  },
]

function linesFromLabels(labels: string[]): SheetLine[] {
  return labels.map((label) => ({
    id: newId(),
    label,
    amount: 0,
    dueDay: null,
  }))
}

function presetToCategory(preset: CategoryPreset): SheetCategory {
  return {
    id: preset.id,
    title: preset.title,
    lines: linesFromLabels(preset.items),
  }
}

export function buildDefaultCategories(): SheetCategory[] {
  return BUILTIN_CATEGORY_PRESETS.map(presetToCategory)
}

export function cloneCategoriesForNewMonth(source: SheetCategory[]): SheetCategory[] {
  return source.map((c) => ({
    id: c.id,
    title: c.title,
    lines: c.lines.map((l) => ({
      id: newId(),
      label: l.label,
      amount: 0,
      dueDay: l.dueDay ?? null,
    })),
  }))
}

/** Novo mês a partir do anterior: cabeçalho, blocos, linhas e valores */
export function cloneMonthSheetFromSource(
  source: MonthSheet,
  key: string,
  label: string,
): MonthSheet {
  return {
    key,
    label,
    netSalary: source.netSalary,
    salaryDay: source.salaryDay ?? null,
    extraIncomes: (source.extraIncomes ?? []).map((item) => ({
      id: newId(),
      label: item.label,
      amount: item.amount,
      day: item.day ?? null,
    })),
    categories: source.categories.map((c) => ({
      id: c.id,
      title: c.title,
      lines: c.lines.map((l) => ({
        id: newId(),
        label: l.label,
        amount: l.amount,
        dueDay: l.dueDay ?? null,
      })),
    })),
  }
}

export function createMonthSheet(
  key: string,
  label: string,
  categoryTemplate?: SheetCategory[],
): MonthSheet {
  return {
    key,
    label,
    netSalary: 0,
    salaryDay: null,
    extraIncomes: [],
    categories: categoryTemplate
      ? cloneCategoriesForNewMonth(categoryTemplate)
      : buildDefaultCategories(),
  }
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function monthKeyToLabel(key: string): string {
  const [y, m] = key.split('-')
  const names = [
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
  const idx = parseInt(m, 10) - 1
  return `${names[idx] ?? m}/${y}`
}

export function initialSheets(): MonthSheet[] {
  const key = currentMonthKey()
  return [createMonthSheet(key, monthKeyToLabel(key))]
}

export function categoryFromPreset(presetId: string): SheetCategory | null {
  const preset = BUILTIN_CATEGORY_PRESETS.find((p) => p.id === presetId)
  return preset ? presetToCategory(preset) : null
}
