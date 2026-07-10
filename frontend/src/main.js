import { createApp } from 'vue';
import { clerkPlugin } from '@clerk/vue';
import App from './App.vue';
import router from './router';
import './styles/base.css';
import './styles/gallery-art-presentation.css';
import './styles/product-expanded-image.css';
import './styles/gallery-product-grid.css';
import './styles/home-page-layout.css';
import './styles/contact-page-layout.css';
import './styles/hero-display.css';
import './styles/admin-data-table.css';
import './styles/admin-customize.css';
import './styles/mobile.css';
import './styles/loading.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
    throw new Error(
        'Missing VITE_CLERK_PUBLISHABLE_KEY. Add your Clerk key to .env (project root), then restart Vite.'
    );
}

const app = createApp(App);
app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY,
    signInUrl: import.meta.env.VITE_CLERK_SIGN_IN_URL || '/admin/login',
    signUpUrl: import.meta.env.VITE_CLERK_SIGN_UP_URL || '/admin/sign-up',
    signInFallbackRedirectUrl:
        import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/admin/dashboard',
    signUpFallbackRedirectUrl:
        import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/admin/dashboard'
});
app.use(router);
app.mount('#app');
