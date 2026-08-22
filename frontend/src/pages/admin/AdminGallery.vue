<template>
  <div class="admin-page admin-listings">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Gallery</h1>
      <router-link to="/admin/gallery/new" class="admin-page-header__btn admin-page-header__btn--primary">
        Add work
      </router-link>
    </header>

    <PageReveal :ready="!loading">
      <template #skeleton>
        <div class="skeleton-stack" aria-hidden="true">
          <Skeleton v-for="n in 6" :key="n" variant="table-row" height="4.5rem" />
        </div>
      </template>

      <p v-if="error" class="error admin-page-header__status">{{ error }}</p>
      <p v-else-if="!items.length" class="admin-float admin-float--padded admin-page-empty">
        No finished work yet.
        <router-link to="/admin/gallery/new">Add your first piece</router-link>
      </p>

      <template v-else>
      <AdminListSortBar
        v-model="sortBy"
        select-id="gallery-sort"
        :options="LISTING_SORT_OPTIONS"
      />

      <ul class="admin-mobile-cards" aria-label="Gallery">
        <li v-for="item in sortedItems" :key="'m-' + item._id" class="admin-mobile-card admin-mobile-card--listing">
          <div class="admin-mobile-card__corner">
            <span
              class="admin-status-pill admin-mobile-card__status"
              :class="item.is_active ? 'admin-status-pill--active' : 'admin-status-pill--inactive'"
            >
              {{ statusLabel(item) }}
            </span>
            <AdminListingActionsMenu
              :product-id="item._id"
              :title="displayLabel(item)"
              :is-active="item.is_active"
              edit-base="/admin/gallery/edit"
              :open="openMenuId === item._id"
              @toggle="toggleMenu(item._id)"
              @close="closeMenu"
              @toggle-active="onToggle(item)"
              @delete="onDelete(item)"
            />
          </div>
          <h3 class="admin-mobile-card__title">{{ displayLabel(item) }}</h3>
          <div class="admin-mobile-card__body">
            <div class="admin-mobile-card__media" aria-hidden="true">
              <div class="admin-data-table__thumb admin-data-table__thumb--lg">
                <img
                  v-if="thumbUrl(item)"
                  :src="thumbUrl(item)"
                  :alt="thumbAlt(item)"
                  width="56"
                  height="56"
                  loading="lazy"
                />
                <span v-else class="admin-data-table__thumb-placeholder">—</span>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div class="admin-float admin-float--table admin-float--desktop-only">
      <div class="admin-panel__table-wrap admin-panel__table-wrap--desktop">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Label</th>
              <th>Status</th>
              <th class="admin-data-table__actions-cell"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedItems" :key="item._id">
              <td>
                <div class="admin-data-table__thumb" aria-hidden="true">
                  <img
                    v-if="thumbUrl(item)"
                    :src="thumbUrl(item)"
                    :alt="thumbAlt(item)"
                    width="48"
                    height="48"
                    loading="lazy"
                  />
                  <span v-else class="admin-data-table__thumb-placeholder">—</span>
                </div>
              </td>
              <td class="admin-data-table__title-cell">{{ displayLabel(item) }}</td>
              <td>
                <span
                  class="admin-status-pill"
                  :class="item.is_active ? 'admin-status-pill--active' : 'admin-status-pill--inactive'"
                >
                  {{ statusLabel(item) }}
                </span>
              </td>
              <td class="admin-data-table__actions-cell">
                <AdminListingActionsMenu
                  :product-id="item._id"
                  :title="displayLabel(item)"
                  :is-active="item.is_active"
                  edit-base="/admin/gallery/edit"
                  :open="openMenuId === item._id"
                  @toggle="toggleMenu(item._id)"
                  @close="closeMenu"
                  @toggle-active="onToggle(item)"
                  @delete="onDelete(item)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </template>
    </PageReveal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  getAdminPortfolio,
  deleteAdminPortfolio,
  toggleAdminPortfolioActive
} from '../../services/api.js';
import {
  primaryPortfolioImageUrl,
  portfolioTitle
} from '../../utils/portfolioDisplay.js';
import { LISTING_SORT_OPTIONS, sortProducts } from '../../utils/adminListSort.js';
import AdminListingActionsMenu from '../../components/admin/AdminListingActionsMenu.vue';
import AdminListSortBar from '../../components/admin/AdminListSortBar.vue';
import PageReveal from '../../components/loading/PageReveal.vue';
import Skeleton from '../../components/loading/Skeleton.vue';

const items = ref([]);
const sortBy = ref('newest');
const loading = ref(true);
const error = ref('');
const openMenuId = ref(null);

const sortedItems = computed(() => sortProducts(items.value, sortBy.value));

function displayLabel(item) {
  return portfolioTitle(item);
}

function thumbUrl(item) {
  return primaryPortfolioImageUrl(item);
}

function thumbAlt(item) {
  const primary = item?.portfolio_images?.find((i) => i?.is_primary) || item?.portfolio_images?.[0];
  return primary?.alt_text || portfolioTitle(item);
}

function statusLabel(item) {
  return item.is_active ? 'Active' : 'Inactive';
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

function closeMenu() {
  openMenuId.value = null;
}

function onDocumentClick() {
  closeMenu();
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    items.value = await getAdminPortfolio();
  } catch (e) {
    error.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  document.addEventListener('click', onDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
});

async function onToggle(item) {
  try {
    await toggleAdminPortfolioActive(item._id);
    await load();
  } catch (e) {
    alert(e.message || 'Could not update status');
  }
}

async function onDelete(item) {
  if (!window.confirm(`Delete "${displayLabel(item)}"? It will be hidden from the gallery.`)) return;
  try {
    await deleteAdminPortfolio(item._id);
    await load();
  } catch (e) {
    alert(e.message || 'Delete failed');
  }
}
</script>
