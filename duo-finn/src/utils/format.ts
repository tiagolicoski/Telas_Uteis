export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Valor para inputs de moeda (sem símbolo R$), sempre com 2 casas decimais */
export function formatMoneyField(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseAmount(input: string): number {
  const trimmed = input.trim()
  if (!trimmed) return 0
  // Ex.: digitar 2000 (sem vírgula) = R$ 2.000,00
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, Number.parseInt(trimmed, 10))
  }
  const normalized = trimmed.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/** Máscara enquanto digita: 1500 vira 1.500 e 1500,5 vira 1.500,5. */
export function formatPurchaseTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '')
  if (!cleaned) return ''
  const comma = cleaned.indexOf(',')
  const wholeDigits = (comma === -1 ? cleaned : cleaned.slice(0, comma))
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
  const fraction = comma === -1 ? null : cleaned.slice(comma + 1).replace(/\D/g, '').slice(0, 2)
  const grouped = wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  if (fraction === null) return grouped
  return `${grouped || '0'},${fraction}`
}

/** Onde o cursor fica depois da máscara, inclusive depois da vírgula dos centavos. */
export function purchaseTypingCaret(raw: string, caret: number, formatted: string): number {
  const before = raw.slice(0, caret)
  const digitsBefore = before.replace(/\D/g, '').length
  const afterComma = before.includes(',')
  if (!afterComma) {
    let digits = 0
    for (let index = 0; index < formatted.length; index += 1) {
      if (/\d/.test(formatted[index] ?? '')) {
        digits += 1
        if (digits === digitsBefore) return index + 1
      }
    }
    return formatted.length
  }
  const commaAt = formatted.indexOf(',')
  if (commaAt === -1) return formatted.length
  const digitsInWhole = formatted.slice(0, commaAt).replace(/\D/g, '').length
  if (digitsBefore <= digitsInWhole) return commaAt + 1
  let digits = digitsInWhole
  for (let index = commaAt + 1; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? '')) {
      digits += 1
      if (digits === digitsBefore) return index + 1
    }
  }
  return formatted.length
}

/** Texto simples para editar (sem máscara de milhar) */
export function moneyValueToEdit(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const fixed = Math.round(value * 100) / 100
  const [whole, frac] = fixed.toFixed(2).split('.')
  if (frac === '00') return whole
  return `${whole},${frac}`
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
