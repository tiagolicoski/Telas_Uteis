import { financePayload, financeSlice, saveFinance, stateFromPayload } from './storage'
import type { AppState, FinanceData } from './types'

export type RemoteState = {
  updatedAt: number
  finance: FinanceData
}

const SYNCED_KEY = 'duo-finn-synced'

export function markSynced() {
  localStorage.setItem(SYNCED_KEY, '1')
}

export function wasSynced(): boolean {
  return localStorage.getItem(SYNCED_KEY) === '1'
}

export async function fetchRemote(): Promise<RemoteState | null> {
  const res = await fetch('/api/state')
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Não foi possível ler a planilha compartilhada')
  const body = (await res.json()) as { updatedAt?: number; data?: Record<string, unknown> }
  if (!body.data || typeof body.updatedAt !== 'number') return null
  return {
    updatedAt: body.updatedAt,
    finance: financeSlice(stateFromPayload(body.data)),
  }
}

export async function pushRemote(state: AppState): Promise<number> {
  const res = await fetch('/api/state', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data: financePayload(state) }),
  })
  if (!res.ok) throw new Error('Não foi possível gravar a planilha compartilhada')
  const body = (await res.json()) as { updatedAt: number }
  saveFinance(state, body.updatedAt)
  markSynced()
  return body.updatedAt
}
