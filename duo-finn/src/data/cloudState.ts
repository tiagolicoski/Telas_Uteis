import type { AppState } from './types'
import { fetchRemote, type RemoteState } from './remoteState'
import { financePayload, financeSlice, saveFinance, scoreFinance, stateFromPayload } from './storage'
import { supabase } from './supabaseClient'

function syncedKey(userId: string) {
  return `duo-finn-synced:${userId}`
}

export function wasCloudSynced(userId: string) {
  return localStorage.getItem(syncedKey(userId)) === '1'
}

export function markCloudSynced(userId: string) {
  localStorage.setItem(syncedKey(userId), '1')
}

export function accountLabel(email: string | undefined, metadata: Record<string, unknown> | undefined) {
  const meta = metadata ?? {}
  for (const key of ['full_name', 'name', 'display_name']) {
    const value = meta[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  if (email && /marcele/i.test(email)) return 'Marcele'
  if (email && /tiago/i.test(email)) return 'Tiago'
  const local = email?.split('@')[0]
  return local || 'Conta'
}

export function isTiagoAccount(email: string | undefined, label: string) {
  return /tiago/i.test(label) || /tiago/i.test(email ?? '')
}

export async function fetchCloud(userId: string): Promise<RemoteState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('planilhas')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data?.data || typeof data.data !== 'object') return null
  const updatedAt = Date.parse(String(data.updated_at))
  return {
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
    finance: financeSlice(stateFromPayload(data.data as Record<string, unknown>)),
  }
}

export async function pushCloud(userId: string, state: AppState): Promise<number> {
  if (!supabase) throw new Error('Supabase não configurado')
  const updatedAt = Date.now()
  const { error } = await supabase.from('planilhas').upsert({
    user_id: userId,
    data: financePayload(state),
    updated_at: new Date(updatedAt).toISOString(),
  })
  if (error) throw error
  saveFinance(state, updatedAt, userId)
  markCloudSynced(userId)
  return updatedAt
}

/** Planilha deste computador, só existe com o servidor do Vite ligado. */
export async function spreadsheetOnThisComputer(): Promise<RemoteState | null> {
  try {
    const file = await fetchRemote()
    if (file && scoreFinance(file.finance) > 0) return file
  } catch {
    return null
  }
  return null
}
