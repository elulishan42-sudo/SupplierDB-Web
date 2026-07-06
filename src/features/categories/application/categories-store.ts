import { create } from 'zustand';
import { Category } from '../domain/category';
import { categoryRepository } from '../data/category-repository';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: true,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryRepository.fetchAll();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createCategory: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      await categoryRepository.create(name);
      await get().loadCategories();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await categoryRepository.delete(id);
      await get().loadCategories();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
