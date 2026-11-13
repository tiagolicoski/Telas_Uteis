import { useEffect, useRef, useState } from 'react'
import {
  formatMoneyField,
  moneyValueToEdit,
  parseAmount,
} from '../../utils/format'

type Props = {
  value: number
  onCommit: (value: number) => void
  className?: string
}

export function MoneyInput({ value, onCommit, className }: Props) {
  const [text, setText] = useState(() => formatMoneyField(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (focusedRef.current) return
    setText(formatMoneyField(value))
  }, [value])

  function commit(raw: string) {
    const n = parseAmount(raw)
    onCommit(n)
    setText(formatMoneyField(n))
  }

  function handleFocus() {
    focusedRef.current = true
    setText(moneyValueToEdit(value))
  }

  function handleBlur() {
    focusedRef.current = false
    commit(text)
  }

  return (
    <input
      className={className}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit(text)
          focusedRef.current = false
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      placeholder="0,00"
      inputMode="decimal"
    />
  )
}
