import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import { watch } from 'vue';
import { getAdminSession } from '../services/api.js';
import { isClerkEnabled } from '../utils/clerkConfig.js';
import {
    ensureStorefrontNavLoaded,
    hasStorefrontNavCache,
    invalidateStorefrontNav,
    showContactNav,
    showBookNav
} from '../composables/useStorefrontNav.js';
import { startNavProgress, finishNavProgress } from '../composables/useNavProgress.js';

const Gallery = () => import('../pages/Gallery.vue');
const WannaDos = () => import('../pages/WannaDos.vue');
const Contact = () => import('../pages/Contact.vue');
const BookAppointment = () => import('../pages/BookAppointment.vue');
const Checkout = () => import('../pages/Checkout.vue');
const OrderSuccess = () => import('../pages/OrderSuccess.vue');
const CheckoutCancel = () => import('../pages/CheckoutCancel.vue');
const AdminLogin = () => import('../pages/AdminLogin.vue');
const AdminSignUp = () => import('../pages/AdminSignUp.vue');
const AdminSsoCallback = () => import('../pages/AdminSsoCallback.vue');
const AdminLayout = () => import('../components/admin/AdminLayout.vue');
const AdminDashboard = () => import('../pages/admin/AdminDashboard.vue');
const AdminOrders = () => import('../pages/admin/AdminOrders.vue');
const AdminListings = () => import('../pages/admin/AdminListings.vue');
const AdminGallery = () => import('../pages/admin/AdminGallery.vue');
const AdminCustomize = () => import('../pages/admin/AdminCustomize.vue');
const AdminSettings = () => import('../pages/admin/AdminSettings.vue');
const AdminForm = () => import('../pages/AdminForm.vue');
const AdminCreate = () => import('../pages/AdminCreate.vue');
const AdminPortfolioCreate = () => import('../pages/AdminPortfolioCreate.vue');
const AdminPortfolioForm = () => import('../pages/AdminPortfolioForm.vue');
// const AdminInstagramAi = () => import('../pages/AdminInstagramAi.vue');

const routes = [
    { path: '/', name: 'home', component: Home },
    { path: '/gallery', name: 'gallery', component: Gallery },
    { path: '/wanna-dos', name: 'wanna-dos', component: WannaDos },
    { path: '/checkout', name: 'checkout', component: Checkout },
    { path: '/order-success', name: 'order-success', component: OrderSuccess },
    {
        path: '/checkout/success',
        redirect: (to) => ({
            path: '/order-success',
            query: to.query
        })
    },
    { path: '/checkout/cancel', name: 'checkout-cancel', component: CheckoutCancel },
    { path: '/contact', name: 'contact', component: Contact },
    { path: '/book', name: 'book-appointment', component: BookAppointment },
    { path: '/art/:slug', redirect: { name: 'gallery' } },
    {
        path: '/product/:slug',
        redirect: (to) => ({
            name: 'wanna-dos',
            query: { product: String(to.params.slug || '') }
        })
    },
    { path: '/gallery/admin/login', redirect: '/admin/login' },
    { path: '/gallery/admin/sign-up', redirect: '/admin/sign-up' },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    { path: '/admin/sign-up', name: 'admin-sign-up', component: AdminSignUp },
    { path: '/admin/sso-callback', name: 'admin-sso-callback', component: AdminSsoCallback },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            { path: '', redirect: { name: 'admin-dashboard' } },
            { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboard },
            { path: 'orders', name: 'admin-orders', component: AdminOrders },
            { path: 'listings', name: 'admin-listings', component: AdminListings },
            { path: 'gallery', name: 'admin-gallery', component: AdminGallery },
            { path: 'gallery/new', name: 'admin-gallery-new', component: AdminPortfolioCreate },
            { path: 'gallery/edit/:id', name: 'admin-gallery-edit', component: AdminPortfolioForm, props: true },
            { path: 'customize', name: 'admin-customize', component: AdminCustomize },
            // { path: 'ai', name: 'admin-ai', component: AdminInstagramAi }, // Not used for this site
            { path: 'settings', name: 'admin-settings', component: AdminSettings },
            { path: 'new', name: 'admin-new', component: AdminCreate },
            { path: 'edit/:id', name: 'admin-edit', component: AdminForm, props: true }
        ]
    },
    { path: '/admin/social-links', redirect: '/admin/customize' },
    { path: '/admin/display-pictures', redirect: '/admin/customize' }
    // { path: '/admin/instagram-ai', redirect: '/admin/ai' } // Not used for this site
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }

        if (to.name === 'gallery' && from.name === 'gallery') {
            return false;
        }

        if (to.name === 'wanna-dos' && from.name === 'wanna-dos') {
            return false;
        }

        return { top: 0 };
    }
});

function waitForClerkLoaded(isLoaded) {
    if (isLoaded.value) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const stop = watch(isLoaded, (loaded) => {
            if (loaded) {
                stop();
                resolve();
            }
        });
    });
}

router.beforeEach(async (to, from) => {
    const isGalleryOverlayToggle = to.name === 'gallery' && from.name === 'gallery';
    const isSamePlace = to.fullPath === from.fullPath;
    if (!isSamePlace && !isGalleryOverlayToggle) {
        startNavProgress();
    }

    if (!to.path.startsWith('/admin')) {
        if (hasStorefrontNavCache()) {
            ensureStorefrontNavLoaded();
        } else {
            await ensureStorefrontNavLoaded();
        }
        if (to.name === 'contact' && !showContactNav.value) {
            return { name: 'home' };
        }
        if (to.name === 'book-appointment' && !showBookNav.value) {
            return { name: 'home' };
        }
        return true;
    }

    if (to.name === 'admin-login' || to.name === 'admin-sign-up' || to.name === 'admin-sso-callback') {
        if (!isClerkEnabled() && (to.name === 'admin-sign-up' || to.name === 'admin-sso-callback')) {
            return { name: 'admin-login' };
        }
        return true;
    }

    if (!isClerkEnabled()) {
        try {
            await getAdminSession();
            return true;
        } catch (err) {
            if (err?.status === 401) {
                return { name: 'admin-login', query: { redirect: to.fullPath } };
            }
            return { name: 'admin-login', query: { redirect: to.fullPath } };
        }
    }

    const { useAuth } = await import('@clerk/vue');
    const { isLoaded, isSignedIn } = useAuth();
    await waitForClerkLoaded(isLoaded);

    if (!isSignedIn.value) {
        return { name: 'admin-login', query: { redirect: to.fullPath } };
    }

    try {
        await getAdminSession();
        return true;
    } catch (err) {
        if (err?.status === 401) {
            try {
                sessionStorage.setItem(
                    'admin_login_notice',
                    'Your sign-in could not be kept active. Try again after the site redeploys, or contact support if this continues.'
                );
            } catch {
                /* ignore */
            }
        }
        return { name: 'admin-login', query: { redirect: to.fullPath } };
    }
});

router.afterEach((to, from) => {
    finishNavProgress();
    if (from.path.startsWith('/admin') && !to.path.startsWith('/admin')) {
        invalidateStorefrontNav();
        ensureStorefrontNavLoaded();
    }
    if (to.path.startsWith('/admin')) {
        return;
    }
    if (typeof window.gtag !== 'function') {
        return;
    }
    window.gtag('event', 'page_view', {
        page_path: to.fullPath,
        page_location: window.location.origin + to.fullPath,
        page_title: document.title
    });
});

router.onError(() => {
    finishNavProgress();
});

export default router;
