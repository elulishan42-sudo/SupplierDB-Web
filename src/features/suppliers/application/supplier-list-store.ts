import { create } from 'zustand';
import { Supplier, SupplierFilters, createDefaultFilters } from '../domain/supplier';
import { supplierRepository } from '../data/supplier-repository';

interface SupplierListState {
  items: Supplier[];
  filters: SupplierFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  loadFirstPage: (filters?: SupplierFilters) => Promise<void>;
  applyFilters: (filters: SupplierFilters) => Promise<void>;
  search: (term: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSupplierListStore = create<SupplierListState>((set, get) => ({
  items: [],
  filters: createDefaultFilters(),
  isLoading: true,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  page: 0,

  loadFirstPage: async (filters?: SupplierFilters) => {
    const currentFilters = filters ?? get().filters;
    set({ isLoading: true, error: null, page: 0 });
    try {
      const items = await supplierRepository.fetchPage(0, currentFilters);
      set({
        items,
        filters: currentFilters,
        isLoading: false,
        hasMore: items.length === 30,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  applyFilters: async (filters: SupplierFilters) => {
    set({ isLoading: true, error: null });
    try {
      const items = await supplierRepository.fetchPage(0, filters);
      set({
        items,
        filters,
        isLoading: false,
        hasMore: items.length === 30,
        page: 0,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  search: (term: string) => {
    const current = get().filters;
    get().applyFilters({ ...current, search: term });
  },

  loadMore: async () => {
    const state = get();
    if (state.isLoadingMore || !state.hasMore) return;

    set({ isLoadingMore: true });
    const nextPage = state.page + 1;
    try {
      const newItems = await supplierRepository.fetchPage(nextPage, state.filters);
      set({
        items: [...state.items, ...newItems],
        isLoadingMore: false,
        hasMore: newItems.length === 30,
        page: nextPage,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoadingMore: false });
    }
  },

  refresh: async () => {
    await get().loadFirstPage();
  },
}));
