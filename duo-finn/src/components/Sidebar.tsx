import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react'
import type { NavId } from '../data/types'
import { useAccount } from '../context/AccountContext'
import { NAV_LABELS, useFinance } from '../context/FinanceContext'
import { monthsByYear } from '../utils/sheet'
import './Sidebar.css'

const menuItems: NavId[] = ['overview', 'cashflow', 'reports']

const icons: Partial<Record<NavId, LucideIcon>> = {
  overview: LayoutDashboard,
  cashflow: ArrowLeftRight,
  reports: BarChart3,
}

function navLabel(id: NavId): string {
  if (id === 'cashflow') return 'Planilha'
  if (id === 'reports') return 'Relatórios'
  return NAV_LABELS[id]
}

interface SidebarProps {
  mobileOpen?: boolean
  onNavigate?: () => void
}

export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const { state, setNav, setTheme, toggleProfile, toggleSidebarCollapsed, dispatch } =
    useFinance()
  const account = useAccount()
  const collapsed = state.sidebarCollapsed

  const monthGroups = monthsByYear(state.sheetMonths)

  function goNav(id: NavId) {
    setNav(id)
    onNavigate?.()
  }

  function pickMonth(key: string) {
    dispatch({ type: 'SET_SHEET_MONTH', key })
    onNavigate?.()
  }

  function renderNavItem(id: NavId) {
    const label = navLabel(id)
    const Icon = icons[id]
    if (!Icon) return null
    return (
      <li key={id}>
        <button
          type="button"
          className={`nav-link ${state.nav === id ? 'active' : ''}`}
          onClick={() => goNav(id)}
          title={collapsed ? label : undefined}
        >
          <span className="nav-icon" aria-hidden>
            <Icon size={18} strokeWidth={1.75} />
          </span>
          <span className="nav-text">{label}</span>
        </button>
      </li>
    )
  }

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      aria-hidden={false}
    >
      <div className="sidebar-brand">
        <div className="sidebar-brand-main">
          <div className="avatars">
            <span className="avatar a1">M</span>
            <span className="avatar a2">A</span>
          </div>
          <div className="brand-text">
            <strong className="brand-name">Duo Finn</strong>
            <p className="brand-sub">Finanças em casal</p>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleSidebarCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Minimizar menu'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Seções">
        <p className="nav-section">Menu</p>
        <ul>{menuItems.map(renderNavItem)}</ul>

        <div className="sidebar-months">
          <label className="month-field">
            <span className="nav-section">Mês</span>
            <select
              className="month-select"
              aria-label="Mês da planilha"
              value={state.activeSheetMonthKey}
              onChange={(event) => pickMonth(event.target.value)}
            >
              {monthGroups.map((group) => (
                <optgroup key={group.year} label={group.year}>
                  {group.months.map((month) => (
                    <option key={month.key} value={month.key}>
                      {month.label.split('/')[0]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="theme-toggle">
          <button
            type="button"
            className={`theme-btn ${state.theme === 'light' ? 'active' : ''}`}
            aria-label="Tema claro"
            title="Tema claro"
            onClick={() => setTheme('light')}
          >
            <Sun size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className={`theme-btn ${state.theme === 'dark' ? 'active' : ''}`}
            aria-label="Tema escuro"
            title="Tema escuro"
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} strokeWidth={1.75} />
          </button>
        </div>
        {account.cloud ? (
          <button
            type="button"
            className="profile-switch"
            onClick={() => void account.signOut()}
            title={collapsed ? `Sair (${account.label})` : 'Sair'}
          >
            <span className="avatar small a1">{account.label.slice(0, 1).toUpperCase()}</span>
            <span className="profile-label">{account.label}</span>
            <span className="profile-label">Sair</span>
          </button>
        ) : (
          <button
            type="button"
            className="profile-switch"
            onClick={toggleProfile}
            title={
              collapsed
                ? state.profile === 'pessoa1'
                  ? 'Pessoa 1'
                  : 'Pessoa 2'
                : undefined
            }
          >
            <span className="avatar small a1">P</span>
            <span className="profile-label">
              {state.profile === 'pessoa1' ? 'Pessoa 1' : 'Pessoa 2'}
            </span>
            <ChevronDown className="chev" size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </aside>
  )
}
