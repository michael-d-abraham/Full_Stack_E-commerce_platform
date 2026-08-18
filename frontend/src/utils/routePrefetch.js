/**
 * Warm frequently used route chunks after idle / on hover.
 */

const loaders = {
  gallery: () => import('../pages/Gallery.vue'),
  product: () => import('../pages/ProductDetail.vue'),
  checkout: () => import('../pages/Checkout.vue'),
  contact: () => import('../pages/Contact.vue'),
  book: () => import('../pages/BookAppointment.vue'),
  adminLayout: () => import('../components/admin/AdminLayout.vue'),
  adminDashboard: () => import('../pages/admin/AdminDashboard.vue')
};

const warmed = new Set();

export function prefetchRouteChunk(name) {
  const loader = loaders[name];
  if (!loader || warmed.has(name)) {
    return Promise.resolve();
  }
  warmed.add(name);
  return loader().catch(() => {
    warmed.delete(name);
  });
}

export function prefetchRouteChunks(names = []) {
  return Promise.all(names.map((name) => prefetchRouteChunk(name)));
}

export function prefetchStorefrontRoutes() {
  return prefetchRouteChunks(['gallery', 'product', 'checkout']);
}
