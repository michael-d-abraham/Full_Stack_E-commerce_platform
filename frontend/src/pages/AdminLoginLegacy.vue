<template>
  <div class="admin-auth">
    <header class="admin-auth__intro">
      <div class="admin-auth__brand">
        <SiteBrandMark to="/" variant="header" :aria-label="brandHomeAriaLabel" />
      </div>
      <h1 class="page-title admin-auth__title">Admin sign in</h1>
      <p class="admin-auth__lede">
        Local dev mode — use the username and password from <code>ADMIN_USERNAME</code> /
        <code>ADMIN_PASSWORD</code> in your <code>.env</code>.
      </p>
    </header>

    <div class="admin-auth__panel">
      <p v-if="error" class="error admin-auth__error" role="alert">{{ error }}</p>

      <form class="admin-auth__form" @submit.prevent="onSubmit">
        <label class="admin-auth__field">
          <span class="admin-auth__label">Username</span>
          <input
            v-model.trim="username"
            class="admin-auth__input"
            name="username"
            type="text"
            autocomplete="username"
            required
            :disabled="busy"
          >
        </label>

        <label class="admin-auth__field">
          <span class="admin-auth__label">Password</span>
          <input
            v-model="password"
            class="admin-auth__input"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="busy"
          >
        </label>

        <button type="submit" class="btn-primary admin-auth__submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="admin-auth__footer">
        <router-link to="/gallery">← Back to portfolio</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteBrandMark from '../components/brand/SiteBrandMark.vue';
import { useSiteBrand, ensureSiteBrandLoaded } from '../composables/useSiteBrand.js';
import { loginAdmin } from '../services/api.js';
import '../styles/admin-auth.css';

const route = useRoute();
const router = useRouter();
const { brandHomeAriaLabel } = useSiteBrand();

const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

function redirectTarget() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  if (
    redirect.startsWith('/admin') &&
    !redirect.startsWith('/admin/login') &&
    !redirect.startsWith('/admin/sign-up')
  ) {
    return redirect;
  }
  return '/admin/dashboard';
}

async function onSubmit() {
  error.value = '';
  busy.value = true;
  try {
    await loginAdmin({
      username: username.value,
      plainPassword: password.value
    });
    await router.replace(redirectTarget());
  } catch (e) {
    error.value = e.message || 'That username or password is not correct.';
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  ensureSiteBrandLoaded();
});
</script>
