import type { AppState } from './types'
import { DEFAULT_OVERVIEW_BLOCK_IDS } from './sheetCategories'
import { currentMonthKey, initialSheets } from './sheetTemplate'

const sheets = initialSheets()

export const initialState: AppState = {
  theme: 'light',
  nav: 'overview',
  profile: 'pessoa1',
  sidebarCollapsed: false,
  selectedPayDay: null,
  activeCardIndex: 0,
  addModalOpen: false,
  monthLabel: 'Dezembro 2026',

  houseBills: [],
  payables: [],
  cards: [],
  moradiaItems: [],
  budgetLines: [],
  monthlySalary: 0,
  sheetMonths: sheets,
  activeSheetMonthKey: sheets[0]?.key ?? currentMonthKey(),
  payablePaid: {},
  overviewBlockIds: [...DEFAULT_OVERVIEW_BLOCK_IDS],
}
