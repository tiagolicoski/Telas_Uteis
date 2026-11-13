import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchRemote, markSynced, pushRemote, wasSynced } from '../data/remoteState'
import { loadState, readStored, saveFinance, scoreFinance } from '../data/storage'
import type {
  AppState,
  Card,
  HouseBill,
  MoradiaItem,
  NavId,
  Payable,
  Theme,
} from '../data/types'
import {
  houseTotals,
  payablesForDay,
  uniquePayDays,
  unpaidCount,
  budgetSegments,
} from '../utils/calculations'
import { overviewFromSheet, type DetailBlock } from '../utils/overviewFromSheet'
import { balanceDrop, buildCashTiming, type BalanceDrop, type CashTiming } from '../utils/cashTiming'
import { getSheetMonth } from '../utils/sheet'
import { formatBRL } from '../utils/format'
import { financeReducer, type FinanceAction } from './financeReducer'

interface FinanceContextValue {
  state: AppState
  dispatch: React.Dispatch<FinanceAction>
  setNav: (nav: NavId) => void
  setTheme: (theme: Theme) => void
  toggleSidebarCollapsed: () => void
  toggleProfile: () => void
  setPayDay: (day: number) => void
  togglePayable: (id: string) => void
  prevCard: () => void
  nextCard: () => void
  cycleMonth: () => void
  toggleOverviewBlock: (categoryId: string) => void
  derived: {
    planilhaLabel: string
    houseBills: HouseBill[]
    payables: Payable[]
    cards: Card[]
    moradiaItems: MoradiaItem[]
    house: ReturnType<typeof houseTotals>
    payDays: number[]
    payablesVisible: ReturnType<typeof payablesForDay>
    payablesDayTotal: number
    notifications: number
    balanceAlert: BalanceDrop | null
    cashTiming: CashTiming | null
    balance: number
    budget: ReturnType<typeof budgetSegments>
    cardsTotal: number
    moradiaTotal: number
    salaryPctLabel: string | null
    monthlySalary: number
    detailBlocks: DetailBlock[]
    detailExpensesTotal: number
    coreExpensesTotal: number
    showDivisao: boolean
    showCartoes: boolean
    showMoradia: boolean
    showDetalhes: boolean
    coreBlockLabels: string[]
  }
  formatBRL: typeof formatBRL
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, undefined, loadState)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('theme-dark', state.theme === 'dark')
  }, [state.theme])

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyRef = useRef(false)
  const revisionRef = useRef(0)
  const pushingRef = useRef(false)
  const skipSaveRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let cancelled = false
    const local = readStored()
    revisionRef.current = local.updatedAt

    void (async () => {
      try {
        const remote = await fetchRemote()
        if (cancelled) return
        const localScore = scoreFinance(local.state)
        const remoteScore = remote ? scoreFinance(remote.finance) : 0
        const firstVisit = !wasSynced()
        const remoteWins =
          remote != null &&
          (firstVisit ? remoteScore >= localScore : remote.updatedAt >= local.updatedAt)

        if (remote && remoteWins) {
          revisionRef.current = remote.updatedAt
          markSynced()
          skipSaveRef.current = true
          saveFinance({ ...local.state, ...remote.finance }, remote.updatedAt)
          dispatch({ type: 'HYDRATE_FINANCE', finance: remote.finance })
        } else {
          pushingRef.current = true
          revisionRef.current = await pushRemote(local.state)
          pushingRef.current = false
        }
      } catch {
        saveFinance(local.state, local.updatedAt || Date.now())
      } finally {
        if (!cancelled) {
          readyRef.current = true
          setReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!readyRef.current) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      pushingRef.current = true
      void pushRemote(state)
        .then((updatedAt) => {
          revisionRef.current = updatedAt
        })
        .catch(() => {
          saveFinance(state)
        })
        .finally(() => {
          pushingRef.current = false
        })
    }, 450)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [
    state.houseBills,
    state.payables,
    state.cards,
    state.moradiaItems,
    state.budgetLines,
    state.monthlySalary,
    state.sheetMonths,
    state.activeSheetMonthKey,
    state.payablePaid,
    state.overviewBlockIds,
    state.theme,
    state.nav,
    state.profile,
    state.sidebarCollapsed,
  ])

  useEffect(() => {
    if (!ready) return
    const timer = setInterval(() => {
      if (pushingRef.current || saveTimerRef.current) return
      void fetchRemote()
        .then((remote) => {
          if (!remote || remote.updatedAt <= revisionRef.current) return
          revisionRef.current = remote.updatedAt
          skipSaveRef.current = true
          saveFinance({ ...stateRef.current, ...remote.finance }, remote.updatedAt)
          dispatch({ type: 'HYDRATE_FINANCE', finance: remote.finance })
        })
        .catch(() => undefined)
    }, 3000)
    return () => clearInterval(timer)
  }, [ready])

  const sheetDerived = useMemo(() => {
    const sheet = getSheetMonth(state.sheetMonths, state.activeSheetMonthKey)
    return overviewFromSheet(sheet, state.payablePaid, state.overviewBlockIds)
  }, [
    state.sheetMonths,
    state.activeSheetMonthKey,
    state.payablePaid,
    state.overviewBlockIds,
  ])

  const derived = useMemo(() => {
    const houseBills = sheetDerived?.houseBills ?? []
    const payables = sheetDerived?.payables ?? []
    const cards = sheetDerived?.cards ?? []
    const moradiaItems = sheetDerived?.moradiaItems ?? []
    const monthlySalary = sheetDerived?.monthlySalary ?? 0

    const house = houseTotals(houseBills)
    const payDays = uniquePayDays(payables)
    const payablesVisible = payablesForDay(payables, state.selectedPayDay)
    const payablesDayTotal = payablesVisible.reduce((s, p) => s + p.amount, 0)
    const balance = sheetDerived?.balance ?? 0
    const activeSheet = getSheetMonth(state.sheetMonths, state.activeSheetMonthKey)
    const cashTiming = activeSheet
      ? buildCashTiming(activeSheet, state.overviewBlockIds)
      : null
    const balanceAlert = balanceDrop(
      state.sheetMonths,
      state.activeSheetMonthKey,
      state.overviewBlockIds,
      balance,
    )
    const timingAlert =
      cashTiming != null &&
      cashTiming.shortfall > 0 &&
      !cashTiming.missingSalaryDay
    const attention = (balanceAlert ? 1 : 0) + (timingAlert ? 1 : 0)
    const budget = budgetSegments(sheetDerived?.budgetLines ?? [])
    const cardsTotal = cards.reduce((s, c) => s + c.amount, 0)
    const moradiaTotal = moradiaItems.reduce((s, m) => s + m.amount, 0)
    let salaryPctLabel: string | null = null
    if (monthlySalary > 0 && balance > 0) {
      const p = ((balance / monthlySalary) * 100).toFixed(0)
      salaryPctLabel = `↑ ${p}% do salário livre`
    }

    return {
      planilhaLabel: sheetDerived?.sheetLabel ?? '',
      houseBills,
      payables,
      cards,
      moradiaItems,
      house,
      payDays,
      payablesVisible,
      payablesDayTotal,
      notifications: unpaidCount(payables) + attention,
      balanceAlert,
      cashTiming,
      balance,
      budget,
      cardsTotal,
      moradiaTotal,
      salaryPctLabel,
      monthlySalary,
      detailBlocks: sheetDerived?.detailBlocks ?? [],
      detailExpensesTotal: sheetDerived?.detailExpensesTotal ?? 0,
      coreExpensesTotal: sheetDerived?.coreExpensesTotal ?? 0,
      showDivisao: sheetDerived?.showDivisao ?? false,
      showCartoes: sheetDerived?.showCartoes ?? false,
      showMoradia: sheetDerived?.showMoradia ?? false,
      showDetalhes: (sheetDerived?.detailBlocks.length ?? 0) > 0,
      coreBlockLabels: sheetDerived?.coreBlockLabels ?? [],
    }
  }, [sheetDerived, state.selectedPayDay, state.sheetMonths, state.activeSheetMonthKey, state.overviewBlockIds])

  useEffect(() => {
    if (derived.payables.length === 0) return
    if (state.selectedPayDay === null) {
      const days = uniquePayDays(derived.payables)
      if (days[0] !== undefined) {
        dispatch({ type: 'SET_PAY_DAY', day: days[0] })
      }
    }
  }, [derived.payables, state.selectedPayDay])

  const setNav = useCallback((nav: NavId) => dispatch({ type: 'SET_NAV', nav }), [])
  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'SET_THEME', theme }), [])
  const toggleSidebarCollapsed = useCallback(
    () => dispatch({ type: 'TOGGLE_SIDEBAR_COLLAPSED' }),
    [],
  )
  const toggleProfile = useCallback(
    () =>
      dispatch({
        type: 'SET_PROFILE',
        profile: state.profile === 'pessoa1' ? 'pessoa2' : 'pessoa1',
      }),
    [state.profile],
  )
  const setPayDay = useCallback(
    (day: number) => dispatch({ type: 'SET_PAY_DAY', day }),
    [],
  )
  const togglePayable = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_PAYABLE', id }),
    [],
  )
  const prevCard = useCallback(() => dispatch({ type: 'PREV_CARD' }), [])
  const nextCard = useCallback(() => dispatch({ type: 'NEXT_CARD' }), [])
  const cycleMonth = useCallback(() => dispatch({ type: 'CYCLE_MONTH' }), [])
  const toggleOverviewBlock = useCallback(
    (categoryId: string) => dispatch({ type: 'TOGGLE_OVERVIEW_BLOCK', categoryId }),
    [],
  )

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      dispatch,
      setNav,
      setTheme,
      toggleSidebarCollapsed,
      toggleProfile,
      setPayDay,
      togglePayable,
      prevCard,
      nextCard,
      cycleMonth,
      toggleOverviewBlock,
      derived,
      formatBRL,
    }),
    [
      state,
      derived,
      setNav,
      setTheme,
      toggleSidebarCollapsed,
      toggleProfile,
      setPayDay,
      togglePayable,
      prevCard,
      nextCard,
      cycleMonth,
      toggleOverviewBlock,
    ],
  )

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve estar dentro de FinanceProvider')
  return ctx
}

export const NAV_LABELS: Record<NavId, string> = {
  overview: 'Visão geral',
  cashflow: 'Planilha do mês',
  cards: 'Cartões',
  home: 'Nossa casa',
  reserve: 'Nossa reserva',
  income: 'Nossa renda',
  bills: 'Contas da casa',
}
