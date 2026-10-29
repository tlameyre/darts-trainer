<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import SectionTitle from '../components/SectionTitle.vue'
import ChangeEmailModal from '../components/profile/ChangeEmailModal.vue'
import ChangePasswordModal from '../components/profile/ChangePasswordModal.vue'

const router     = useRouter()
const authStore  = useAuthStore()
const badgeStore = useBadgeStore()

const firstName   = ref(authStore.profile?.first_name ?? '')
const lastName    = ref(authStore.profile?.last_name  ?? '')
const username    = ref(authStore.profile?.username   ?? '')
const saveLoading = ref(false)
const feedback    = ref('')
const newBadges   = ref([])

const showEmailModal    = ref(false)
const showPasswordModal = ref(false)

const fullName = computed(() => [firstName.value, lastName.value].filter(v => v.trim()).join(' ') || username.value)
const initials = computed(() => {
  const letters = [firstName.value, lastName.value].map(v => v.trim()[0] ?? '').join('')
  return (letters || username.value.trim()[0] || '?').toUpperCase()
})

// Sync si le profil se charge après le montage
watch(() => authStore.profile, (p) => {
  if (!p) return
  firstName.value = p.first_name ?? ''
  lastName.value  = p.last_name  ?? ''
  username.value  = p.username   ?? ''
}, { immediate: true })

async function onSave() {
  saveLoading.value = true
  feedback.value    = ''
  try {
    await authStore.updateProfile({
      first_name: firstName.value.trim(),
      last_name:  lastName.value.trim(),
      username:   username.value.trim(),
    })
    const badges = await badgeStore.checkProfileBadge(authStore.profile)
    if (badges.length) {
      newBadges.value = badges
    } else {
      router.back()
    }
  } catch (e) {
    feedback.value = e.message
  } finally {
    saveLoading.value = false
  }
}

async function onEmailSave(newEmail) {
  try {
    await authStore.updateEmail(newEmail)
    showEmailModal.value = false
    feedback.value = 'Un email de confirmation a été envoyé.'
    setTimeout(() => { feedback.value = '' }, 4000)
  } catch (e) {
    feedback.value = e.message
  }
}

async function onPasswordSave(newPassword) {
  try {
    await authStore.updatePassword(newPassword)
    showPasswordModal.value = false
    feedback.value = 'Mot de passe mis à jour.'
    setTimeout(() => { feedback.value = '' }, 4000)
  } catch (e) {
    feedback.value = e.message
  }
}
</script>

<template>
  <div class="profile-edit">
    <AppHeader title="MODIFIER LE PROFIL" tone="ink" @back="router.back()" />

    <main class="profile-edit__main">

      <div class="profile-edit__identity">
        <span class="profile-edit__avatar">{{ initials }}</span>
        <div class="profile-edit__names">
          <span class="profile-edit__fullname">{{ fullName }}</span>
          <span class="profile-edit__hint">Initiales générées depuis ton prénom et ton nom</span>
        </div>
      </div>

      <div class="profile-edit__columns">
        <section class="profile-edit__section">
          <SectionTitle title="Identité" ruled />

          <div class="profile-edit__names-row">
            <label class="profile-edit__field">
              <span class="profile-edit__label">Prénom</span>
              <input v-model="firstName" class="profile-edit__input" type="text" placeholder="Ton prénom" autocomplete="given-name" />
            </label>

            <label class="profile-edit__field">
              <span class="profile-edit__label">Nom</span>
              <input v-model="lastName" class="profile-edit__input" type="text" placeholder="Ton nom" autocomplete="family-name" />
            </label>
          </div>

          <label class="profile-edit__field">
            <span class="profile-edit__label">Surnom</span>
            <input v-model="username" class="profile-edit__input" type="text" placeholder="Ton surnom" autocomplete="nickname" />
          </label>
        </section>

        <section class="profile-edit__section">
          <SectionTitle title="Compte" ruled />

          <button class="profile-edit__account-item" aria-haspopup="dialog" @click="showEmailModal = true">
            <span class="profile-edit__account-icon"><AppIcon name="mail" :width="18" :height="18" /></span>
            <span class="profile-edit__account-text">
              <span class="profile-edit__account-label">Adresse email</span>
              <span class="profile-edit__account-value">{{ authStore.user?.email }}</span>
            </span>
            <AppIcon name="angle-down" :width="20" :height="20" class="profile-edit__chevron" />
          </button>

          <button class="profile-edit__account-item" aria-haspopup="dialog" @click="showPasswordModal = true">
            <span class="profile-edit__account-icon"><AppIcon name="lock" :width="18" :height="18" /></span>
            <span class="profile-edit__account-text">
              <span class="profile-edit__account-label">Mot de passe</span>
              <span class="profile-edit__account-value">••••••••</span>
            </span>
            <AppIcon name="angle-down" :width="20" :height="20" class="profile-edit__chevron" />
          </button>
        </section>
      </div>

      <p v-if="feedback" class="profile-edit__feedback">{{ feedback }}</p>

    </main>

    <AppButton class="profile-edit__save-btn" size="cta" tone="black" :block="false" :disabled="saveLoading" @click="onSave">
      {{ saveLoading ? '…' : 'Enregistrer' }}
    </AppButton>

    <ChangeEmailModal
      :show="showEmailModal"
      :current-email="authStore.user?.email ?? ''"
      @close="showEmailModal = false"
      @save="onEmailSave"
    />

    <ChangePasswordModal
      :show="showPasswordModal"
      @close="showPasswordModal = false"
      @save="onPasswordSave"
    />

    <BadgeUnlockOverlay :badges="newBadges" @done="router.back()" />
  </div>
</template>

<style lang="scss" scoped>
.profile-edit {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  // Floating above the BottomNav
  &__save-btn {
    position: fixed;
    left: $padding-md;
    right: $padding-md;
    bottom: calc(#{$bottom-nav-height} + env(safe-area-inset-bottom) + #{$padding-md});
    z-index: 10;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom($padding-xxl * 2 + $padding-md);
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: $gap-md;
  }

  &__avatar {
    @include title-xxl;
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $error;
    color: $bg;
  }

  &__names {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__fullname {
    @include title-xxl;
    line-height: 1;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__columns {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__names-row {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__input {
    @include text-md;
    height: 48px;
    padding: 0 $padding-sm;
    background: $white;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: $input-placeholder; }
    &:focus { border-color: $black; }
  }

  &__account-item {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 20px;
    align-items: center;
    gap: $gap-sm;
    width: 100%;
    min-height: 60px;
    padding: $padding-xs $padding-sm;
    background: $surface;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;
    text-align: left;
    transition: border-color 0.15s;

    &:active { border-color: $black; }
  }

  &__account-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
  }

  &__account-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__account-label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__account-value {
    @include text-md;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chevron { transform: rotate(-90deg); }

  &__feedback {
    @include text-sm;
    color: $accent;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .profile-edit {
    &__save-btn {
      left: max(#{$padding-xxl}, calc((100% - 1040px) / 2));
      right: max(#{$padding-xxl}, calc((100% - 1040px) / 2));
    }

    &__main {
      width: 100%;
      max-width: 1040px;
      margin: 0 auto;
      gap: $gap-xl;
      padding: $padding-xxl 0 0;
      @include nav-safe-bottom($padding-xxl * 2 + $padding-xl);
    }

    &__avatar { @include title-xxxl; width: 80px; height: 80px; }
    &__fullname { @include title-xxxl; }
    &__hint { @include text-sm; }

    &__columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-xxl;
      align-items: start;
    }

    &__section { gap: $gap-md; }
    &__names-row { flex-direction: row; > * { flex: 1; } gap: $gap-md; }
    &__label { @include text-sm; }
    &__input { height: 52px; }
    &__feedback { @include text-md; }
  }
}
</style>
