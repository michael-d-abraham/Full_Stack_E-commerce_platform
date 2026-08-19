<template>
  <div class="admin-clerk-setup" role="status">
    <p class="admin-clerk-setup__title">Admin sign-in is not configured</p>
    <p class="admin-clerk-setup__copy">
      Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in the repo-root <code>.env</code> file
      (and <code>CLERK_SECRET_KEY</code> for the Express server). See
      <code>.env.example</code> for the full Clerk block.
    </p>
    <p class="admin-clerk-setup__copy">
      After updating <code>.env</code>, restart both the Vite dev server and the Node API.
    </p>
  </div>
</template>

<style scoped>
.admin-clerk-setup {
  margin: 0;
  padding: 1rem 1.125rem;
  border: 1px solid var(--color-border, #ccc);
  background: var(--color-surface-muted, #f7f7f7);
}

.admin-clerk-setup__title {
  margin: 0 0 0.5rem;
  font-weight: 500;
}

.admin-clerk-setup__copy {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--color-text-muted, #555);
}

.admin-clerk-setup__copy + .admin-clerk-setup__copy {
  margin-top: 0.5rem;
}

.admin-clerk-setup code {
  font-size: 0.875em;
}
</style>
