import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

export const useAuthStore = defineStore('auth', () => {
  const _user    = ref(null)
  const _profile = ref(null)
  const _loading = ref(true)

  const user    = computed(() => _user.value)
  const profile = computed(() => _profile.value)
  const loading = computed(() => _loading.value)
  const isAuth  = computed(() => !!_user.value)

  function generateFriendCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'DMC-'
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Génère un friend_code si absent (utilisateurs existants)
    if (data && !data.friend_code) {
      const code = generateFriendCode()
      await supabase.from('profiles').update({ friend_code: code }).eq('id', userId)
      data.friend_code = code
    }

    _profile.value = data
  }

  // onAuthStateChange est la source unique de vérité.
  // Il fire un événement INITIAL_SESSION au démarrage (session existante ou null),
  // puis SIGNED_IN après l'échange du code PKCE (OAuth Google).
  supabase.auth.onAuthStateChange((event, session) => {
    _user.value = session?.user ?? null
    if (_user.value) fetchProfile(_user.value.id)
    else _profile.value = null

    // Sur mobile (Safari, Arc), INITIAL_SESSION fire avec null pendant l'échange
    // PKCE, puis SIGNED_IN fire avec l'utilisateur. On maintient _loading = true
    // tant que le code n'est pas échangé pour que le guard attende le bon état.
    const hasPkceCode = new URLSearchParams(window.location.search).has('code')
    if (event === 'INITIAL_SESSION' && hasPkceCode && !session) return

    _loading.value = false
  })

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signInWithOAuth(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Toujours rediriger vers la racine de l'app, peu importe la page courante.
        // Évite que /login?code=xxx soit interprété comme une route publique.
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateEmail(newEmail) {
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function updateProfile(fields) {
    const { data, error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', _user.value.id)
      .select()
      .single()
    if (error) throw error
    _profile.value = data
  }

  return {
    user, profile, loading, isAuth,
    signUp, signIn, signInWithOAuth, signOut,
    updateEmail, updatePassword, updateProfile,
    fetchProfile,
  }
})
