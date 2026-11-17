export type Payer = 'you' | 'spouse'
export type Theme = 'light' | 'dark'
export type Profile = 'pessoa1' | 'pessoa2'

export type NavId =
  | 'overview'
  | 'cashflow'
  | 'reports'
  | 'installments'
  | 'cards'
  | 'home'
  | 'reserve'
  | 'income'
  | 'bills'

export type AddKind =
  | 'payable'
  | 'houseBill'
  | 'moradia'
  | 'cardExpense'
  | 'newCard'
  | 'budget'

export interface HouseBill {
  id: string
  name: string
  amount: number
  payer: Payer
}

export interface Payable {
  id: string
  name: string
  amount: number
  dueDay: number
  paid: boolean
}

export interface Card {
  id: string
  bank: string
  tier: string
  amount: number
  limit: number
  dueDay: number
  status: 'open' | 'closed'
  color: 'dark' | 'orange'
}

export interface MoradiaItem {
  id: string
  label: string
  icon: string
  amount: number
}

export interface BudgetLine {
  id: string
  label: string
  amount: number
  color: string
}

export interface SheetLine {
  id: string
  label: string
  amount: number
  /** Dia do mês para pagar. null = sem dia definido. */
  dueDay: number | null
}

export interface SheetCategory {
  id: string
  title: string
  lines: SheetLine[]
  /**
   * true: entra no card Contas a pagar deste mês.
   * false: fica de fora.
   * ausente: segue o bloco no saldo, como antes desta opção.
   */
  inBills?: boolean
}

export interface ExtraIncome {
  id: string
  label: string
  amount: number
  /** Dia do mês em que esse valor cai na conta. */
  day: number | null
}

export interface MonthSheet {
  key: string
  label: string
  netSalary: number
  /** Dia do mês em que o salário cai na conta. */
  salaryDay: number | null
  /** Valores que entram além do salário. */
  extraIncomes: ExtraIncome[]
  categories: SheetCategory[]
}

/** Compra dividida em parcelas. Não entra no saldo nem no bloco do cartão. */
export interface InstallmentPurchase {
  id: string
  label: string
  /** Valor total da compra. Cada parcela é esse valor dividido pela quantidade. */
  purchaseAmount?: number
  /** Valor de cada parcela. Nas compras novas, sai da divisão do total. */
  installmentAmount: number
  /** Quantidade de parcelas, de 1 a 48. */
  count: number
  /** Mês da primeira parcela, no formato AAAA-MM. */
  startKey: string
  /** Etiqueta livre, como o nome do cartão. */
  cardLabel: string
}

export interface FinanceData {
  houseBills: HouseBill[]
  payables: Payable[]
  cards: Card[]
  moradiaItems: MoradiaItem[]
  budgetLines: BudgetLine[]
  monthlySalary: number
  sheetMonths: MonthSheet[]
  activeSheetMonthKey: string
  /** Contas marcadas como pagas na visão geral (chave = id do payable derivado da planilha) */
  payablePaid: Record<string, boolean>
  /** Blocos da planilha que entram no saldo e na visão geral */
  overviewBlockIds: string[]
  /** Cópia dos blocos apagados, para trazer de volta em outro mês. */
  removedBlocks: SheetCategory[]
  /** Blocos que não devem mais aparecer em Trazer de volta. */
  hiddenRestoreIds: string[]
  /** Compras parceladas. A agenda é calculada; a fatura do cartão continua digitada. */
  installmentPurchases: InstallmentPurchase[]
}

export interface UiState {
  theme: Theme
  nav: NavId
  profile: Profile
  sidebarCollapsed: boolean
  selectedPayDay: number | null
  activeCardIndex: number
  addModalOpen: boolean
  monthLabel: string
}

export interface AppState extends FinanceData, UiState {}

export interface AddEntryPayload {
  name: string
  amount: number
  dueDay?: number
  payer?: Payer
  icon?: string
  bank?: string
  limit?: number
  budgetLabel?: string
  budgetColor?: string
  cardId?: string
  salary?: number
}
