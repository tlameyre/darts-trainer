import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Dev only: opening any page with `?isolated` keeps the session in this tab's sessionStorage,
// so several accounts can be logged in at once in tabs of the same browser.
const isolated = import.meta.env.DEV && (
  new URLSearchParams(window.location.search).has('isolated') || sessionStorage.getItem('dev-isolated-session')
)
if (isolated) sessionStorage.setItem('dev-isolated-session', '1')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, isolated ? { auth: { storage: window.sessionStorage } } : undefined)
