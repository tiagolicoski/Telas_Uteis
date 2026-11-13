import { useEffect, useState } from 'react'

type Props = {
  value: string
  onCommit: (value: string) => void
  className?: string
  placeholder?: string
  'aria-label'?: string
}

/** Texto local — só grava no estado ao sair do campo (evita travar ao digitar). */
export function SheetTextInput({
  value,
  onCommit,
  className,
  placeholder,
  'aria-label': ariaLabel,
}: Props) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  function commit() {
    if (text !== value) onCommit(text)
  }

  return (
    <input
      className={className}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}
