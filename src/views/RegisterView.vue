<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import AppButton from '../components/AppButton.vue'
import GoogleAuthButton from '../components/GoogleAuthButton.vue'

const router    = useRouter()
const authStore = useAuthStore()

const username     = ref('')
const email        = ref('')
const password     = ref('')
const error        = ref('')
const loading      = ref(false)
const oauthLoading = ref(false)
const success      = ref(false)

async function onSubmit() {
  error.value   = ''
  loading.value = true
  try {
    const data = await authStore.signUp(email.value, password.value, username.value)
    // Si confirmation email désactivée → session dispo directement
    if (data?.session) {
      router.replace({ name: 'play' })
    } else {
      success.value = true
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function onGoogle() {
  error.value = ''
  oauthLoading.value = true
  try {
    await authStore.signInWithOAuth('google')
  } catch (e) {
    error.value = e.message
    oauthLoading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <header class="auth__header">
      <h1 class="auth__title">DARTS<br>TRAINER</h1>
    </header>

    <div v-if="success" class="auth__success">
      <p>Un email de confirmation a été envoyé à <strong>{{ email }}</strong>.</p>
      <p>Confirme ton adresse puis <router-link :to="{ name: 'login' }">connecte-toi</router-link>.</p>
    </div>

    <form v-else class="auth__form" @submit.prevent="onSubmit">
      <h2 class="auth__subtitle">Créer un compte</h2>

      <div class="auth__field">
        <label class="auth__label">Pseudo</label>
        <input v-model="username" class="auth__input" type="text" placeholder="Ton pseudo" required autocomplete="nickname" />
      </div>

      <div class="auth__field">
        <label class="auth__label">Email</label>
        <input v-model="email" class="auth__input" type="email" placeholder="tu@exemple.com" required autocomplete="email" />
      </div>

      <div class="auth__field">
        <label class="auth__label">Mot de passe</label>
        <input v-model="password" class="auth__input" type="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
      </div>

      <p v-if="error" class="auth__error">{{ error }}</p>

      <AppButton type="submit" variant="primary" :disabled="loading" class="auth__btn">
        {{ loading ? 'Création…' : "S'inscrire" }}
      </AppButton>

      <div class="auth__divider"><span>ou</span></div>

      <GoogleAuthButton :loading="oauthLoading" @click="onGoogle" />
    </form>

    <p class="auth__switch">
      Déjà un compte ?
      <router-link :to="{ name: 'login' }">Se connecter</router-link>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.auth {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md $padding-xl;
  gap: $padding-xl;

  &__header {
    padding-top: $padding-lg;
  }

  &__title {
    @include text-xxl;
    font-weight: 600;
    line-height: 0.9;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__subtitle {
    @include title-lg;
    color: $text-color;
    margin-bottom: $gap-xs;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__label {
    @include text-sm;
    color: $muted;
  }

  &__input {
    @include text-sm;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: $input-placeholder; }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }
  }

  &__error {
    @include text-sm;
    color: $error;
  }

  &__success {
    @include text-sm;
    background: rgba($accent, 0.12);
    border: $border-sm solid rgba($accent, 0.3);
    border-radius: $radius-sm;
    padding: $padding-md;
    color: $text-color;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    line-height: 1.5;

    a { color: $orange; text-decoration: none; }
  }

  &__btn {
    margin-top: $gap-xs;
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    color: $muted;

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
    }

    span { @include text-sm; }
  }

  &__switch {
    @include text-sm;
    color: $muted;
    text-align: center;

    a { color: $orange; text-decoration: none; }
  }
}
</style>
