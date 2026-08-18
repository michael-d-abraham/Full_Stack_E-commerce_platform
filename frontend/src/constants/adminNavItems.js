export const ADMIN_NAV_ITEMS = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/gallery', label: 'Gallery' },
    { to: '/admin/listings', label: "Wanna Do's" },
    { to: '/admin/customize', label: 'Customize' },
    // { to: '/admin/ai', label: 'AI' }, // Not used for this site
    { to: '/admin/settings', label: 'Settings' }
];

export function isAdminNavActive(currentPath, path) {
    if (path === '/admin/listings') {
        return (
            currentPath === '/admin/listings' ||
            currentPath === '/admin/new' ||
            currentPath.startsWith('/admin/edit/')
        );
    }
    if (path === '/admin/gallery') {
        return (
            currentPath === '/admin/gallery' ||
            currentPath === '/admin/gallery/new' ||
            currentPath.startsWith('/admin/gallery/edit/')
        );
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
}
