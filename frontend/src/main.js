import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/base.css';
import './styles/gallery-art-presentation.css';
import './styles/product-expanded-image.css';
import './styles/gallery-product-grid.css';
import './styles/home-page-layout.css';
import './styles/marquee.css';
import './styles/marquee-section.css';
import './styles/contact-page-layout.css';
import './styles/hero-display.css';
import './styles/admin-data-table.css';
import './styles/admin-customize.css';
import './styles/mobile.css';
import './styles/site-header.css';
import './styles/site-footer.css';
import './styles/loading.css';
import { isClerkEnabled, getClerkPublishableKey } from './utils/clerkConfig.js';

async function bootstrap() {
    const app = createApp(App);

    // Clerk admin auth — optional until keys are configured (see .env.example).
    if (isClerkEnabled()) {
        const { clerkPlugin } = await import('@clerk/vue');
        app.use(clerkPlugin, {
            publishableKey: getClerkPublishableKey(),
            signInUrl: import.meta.env.VITE_CLERK_SIGN_IN_URL || '/admin/login',
            signUpUrl: import.meta.env.VITE_CLERK_SIGN_UP_URL || '/admin/sign-up',
            signInFallbackRedirectUrl:
                import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/admin/dashboard',
            signUpFallbackRedirectUrl:
                import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/admin/dashboard'
        });
    }

    app.use(router);
    app.mount('#app');
}

bootstrap();
