import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number | null
  onCommit: (value: number | null) => void
  className?: string
  'aria-label'?: string
}

function toText(value: number | null) {
  return value == null ? '' : String(value)
}

/** Dia do mês — grava ao sair do campo. Vazio limpa o dia. */
export function SheetDayInput({
  value,
  onCommit,
  className,
  'aria-label': ariaLabel = 'Dia de pagamento',
}: Props) {
  const [text, setText] = useState(() => toText(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (focusedRef.current) return
    setText(toText(value))
  }, [value])

  function commit(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) {
      onCommit(null)
      setText('')
      return
    }
    const n = parseInt(trimmed, 10)
    if (!Number.isFinite(n) || n < 1 || n > 31) {
      setText(toText(value))
      return
    }
    onCommit(n)
    setText(String(n))
  }

  return (
    <input
      className={className}
      value={text}
      inputMode="numeric"
      aria-label={ariaLabel}
      placeholder="—"
      onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onFocus={() => {
        focusedRef.current = true
      }}
      onBlur={() => {
        focusedRef.current = false
        commit(text)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}
