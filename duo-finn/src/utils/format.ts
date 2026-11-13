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
