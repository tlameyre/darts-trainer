<script setup>
defineProps({
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <button type="button" class="google-btn" :disabled="loading">
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
      <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
      <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.314 0-9.822-3.398-11.42-8.073l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
      <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
    </svg>
    {{ loading ? 'Redirection…' : 'Continuer avec Google' }}
  </button>
</template>

<style lang="scss" scoped>
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-sm;
  @include text-sm;
  color: $text-color;
  background: rgba(255, 255, 255, 0.07);
  border: $border-sm solid rgba(255, 255, 255, 0.15);
  border-radius: $radius-sm;
  padding: $padding-sm $padding-md;
  transition: background 0.15s;

  &:active { background: rgba(255, 255, 255, 0.12); }
  &:disabled { opacity: 0.4; }
}
</style>
