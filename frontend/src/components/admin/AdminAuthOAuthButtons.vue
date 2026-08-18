<template>
  <div v-if="providers.length" class="admin-auth-oauth">
    <div class="admin-auth-oauth__list">
      <button
        v-for="provider in providers"
        :key="provider.strategy"
        type="button"
        class="admin-auth-oauth__btn"
        :disabled="disabled || busyStrategy === provider.strategy"
        @click="onSelect(provider.strategy)"
      >
        {{ busyStrategy === provider.strategy ? 'Redirecting…' : labelFor(provider) }}
      </button>
    </div>
    <p class="admin-auth-oauth__divider" aria-hidden="true">
      <span>or</span>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSignIn, useSignUp } from '@clerk/vue';
import { useClerkOAuthProviders } from '../../composables/useClerkOAuthProviders.js';
import { clerkErrorMessage } from '../../utils/clerkErrors.js';

const props = defineProps({
  mode: {
    type: String,
    default: 'sign-in',
    validator: (value) => value === 'sign-in' || value === 'sign-up'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  redirectComplete: {
    type: String,
    default: '/admin/dashboard'
  }
});

const emit = defineEmits(['error', 'start']);

const { providers } = useClerkOAuthProviders();
const { isLoaded: signInLoaded, signIn } = useSignIn();
const { isLoaded: signUpLoaded, signUp } = useSignUp();
const busyStrategy = ref('');

function labelFor(provider) {
  return `Continue with ${provider.name}`;
}

function callbackUrl() {
  return `${window.location.origin}/admin/sso-callback`;
}

function completeUrl() {
  const path = props.redirectComplete.startsWith('/')
    ? props.redirectComplete
    : `/${props.redirectComplete}`;
  return `${window.location.origin}${path}`;
}

async function onSelect(strategy) {
  if (props.disabled || busyStrategy.value) {
    return;
  }

  emit('start');
  busyStrategy.value = strategy;

  try {
    if (props.mode === 'sign-up') {
      if (!signUpLoaded.value || !signUp.value) {
        throw new Error('Authentication is still loading. Try again in a moment.');
      }
      await signUp.value.authenticateWithRedirect({
        strategy,
        redirectUrl: callbackUrl(),
        redirectUrlComplete: completeUrl()
      });
      return;
    }

    if (!signInLoaded.value || !signIn.value) {
      throw new Error('Authentication is still loading. Try again in a moment.');
    }
    await signIn.value.authenticateWithRedirect({
      strategy,
      redirectUrl: callbackUrl(),
      redirectUrlComplete: completeUrl()
    });
  } catch (err) {
    busyStrategy.value = '';
    emit('error', err?.message ? err : new Error(clerkErrorMessage(err)));
  }
}
</script>
