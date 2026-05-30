import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

const _user    = ref(null)
const _profile = ref(null)
const _loading = ref(true)

export const user    = computed(() => _user.value)
export const profile = computed(() => _profile.value)
export const loading = computed(() => _loading.value)
export const isAuth  = computed(() => !!_user.value)

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  _profile.value = data
}

// Initialisation — écoute les changements de session Supabase
supabase.auth.getSession().then(({ data: { session } }) => {
  _user.value = session?.user ?? null
  if (_user.value) fetchProfile(_user.value.id)
  _loading.value = false
})

supabase.auth.onAuthStateChange((_event, session) => {
  _user.value = session?.user ?? null
  if (_user.value) fetchProfile(_user.value.id)
  else _profile.value = null
})

export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // Avec WebHashHistory, Supabase redirige vers /#/ après le callback
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function updateProfile(fields) {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', _user.value.id)
    .select()
    .single()
  if (error) throw error
  _profile.value = data
}
