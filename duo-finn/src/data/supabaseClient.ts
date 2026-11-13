import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function cloudEnabled(): boolean {
  return Boolean(url && anonKey)
}

export const supabase: SupabaseClient | null = cloudEnabled()
  ? createClient(url, anonKey)
  : null
