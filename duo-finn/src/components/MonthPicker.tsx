import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { monthKeyToLabel } from '../data/sheetTemplate'
import './MonthPicker.css'

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type MonthOption = { key: string; label: string }

type PanelBox = { top?: number; bottom?: number; left: number; width: number }

function usePanel(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  placement: 'auto' | 'up',
  panelWidth = 196,
) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<PanelBox | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const anchor = anchorRef.current?.getBoundingClientRect()
      if (!anchor) return
      const width = Math.max(anchor.width, panelWidth)
      const viewWidth = document.documentElement.clientWidth
      const left = Math.min(Math.max(8, anchor.left), viewWidth - width - 8)
      const spaceBelow = window.innerHeight - anchor.bottom
      const openUp = placement === 'up' || spaceBelow < 250
      if (openUp) setBox({ bottom: window.innerHeight - anchor.top + 8, left, width })
      else setBox({ top: anchor.bottom + 8, left, width })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchorRef, placement, panelWidth])

  return { panelRef, box }
}

function Panel({
  box,
  panelRef,
  children,
  wide,
}: {
  box: PanelBox
  panelRef: RefObject<HTMLDivElement | null>
  children: ReactNode
  wide?: boolean
}) {
  return createPortal(
    <div
      ref={panelRef as RefObject<HTMLDivElement>}
      className={`month-panel${wide ? ' is-grid' : ''}`}
      style={{ top: box.top, bottom: box.bottom, left: box.left, width: wide ? 248 : box.width }}
    >
      {children}
    </div>,
    document.body,
  )
}

export function MonthGridPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => Number(value.slice(0, 4)) || new Date().getFullYear())
  const { panelRef, box } = usePanel(open, anchorRef, 'auto', 248)
  const selectedMonth = Number(value.slice(5, 7))
  const selectedYear = Number(value.slice(0, 4))

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, panelRef])

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className="month-grid-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setYear(selectedYear || new Date().getFullYear())
          setOpen((current) => !current)
        }}
      >
        <span>{monthKeyToLabel(value).replace('/', ' de ')}</span>
        <ChevronDown size={14} strokeWidth={1.75} />
      </button>
      {open && box && (
        <Panel box={box} panelRef={panelRef} wide>
          <div className="month-panel-year">
            <button type="button" aria-label="Ano anterior" onClick={() => setYear((current) => current - 1)}>
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
            <strong>{year}</strong>
            <button type="button" aria-label="Próximo ano" onClick={() => setYear((current) => current + 1)}>
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          </div>
          <div className="month-panel-grid" role="listbox" aria-label="Meses">
            {SHORT_MONTHS.map((name, index) => {
              const key = `${year}-${String(index + 1).padStart(2, '0')}`
              const selected = year === selectedYear && index + 1 === selectedMonth
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange(key)
                    setOpen(false)
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </Panel>
      )}
    </>
  )
}

export function MonthListPicker({
  value,
  months,
  onChange,
  ariaLabel,
  triggerClassName,
  labelMode = 'full',
  placement = 'auto',
  block = false,
  renderTrigger,
}: {
  value: string
  months: MonthOption[]
  onChange: (key: string) => void
  ariaLabel: string
  triggerClassName?: string
  labelMode?: 'full' | 'month'
  placement?: 'auto' | 'up'
  block?: boolean
  renderTrigger?: (open: boolean) => ReactNode
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { panelRef, box } = usePanel(open, anchorRef, placement)
  const selected = months.find((month) => month.key === value)
  const selectedLabel = selected?.label ?? monthKeyToLabel(value)
  const shown = labelMode === 'month' ? selectedLabel.split('/')[0] : selectedLabel
  const groups = new Map<string, MonthOption[]>()
  for (const month of [...months].sort((a, b) => a.key.localeCompare(b.key))) {
    const year = month.key.slice(0, 4)
    const list = groups.get(year) ?? []
    list.push(month)
    groups.set(year, list)
  }

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, panelRef])

  return (
    <div className={`month-list-anchor${block ? ' is-block' : ''}`} ref={anchorRef}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {renderTrigger ? (
          renderTrigger(open)
        ) : (
          <>
            <span>{shown}</span>
            <ChevronDown className={`chev ${open ? 'open' : ''}`} size={14} strokeWidth={1.75} />
          </>
        )}
      </button>
      {open && box && (
        <Panel box={box} panelRef={panelRef}>
          <div className="month-panel-list" role="listbox" aria-label={ariaLabel}>
            {[...groups.entries()].map(([year, items]) => (
              <div key={year}>
                <p>{year}</p>
                {items.map((month) => (
                  <button
                    key={month.key}
                    type="button"
                    role="option"
                    aria-selected={month.key === value}
                    className={month.key === value ? 'is-selected' : undefined}
                    onClick={() => {
                      onChange(month.key)
                      setOpen(false)
                    }}
                  >
                    {month.label.split('/')[0]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
