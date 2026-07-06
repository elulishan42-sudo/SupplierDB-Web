'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useCategoriesStore } from '@/features/categories/application/categories-store';
import { Category } from '@/features/categories/domain/category';

export default function CategoriesPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const {
    categories,
    isLoading,
    error,
    loadCategories,
    createCategory,
    deleteCategory,
  } = useCategoriesStore();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else {
      loadCategories();
    }
  }, [session, router, loadCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/suppliers')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Suppliers
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            </div>
            <button
              onClick={() => signOut()}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={isCreating || !newCategoryName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Adding...' : 'Add Category'}
            </button>
          </form>
        </div>

        {isLoading && categories.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <ul className="divide-y divide-gray-200">
              {categories.map((category: Category) => (
                <li
                  key={category.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="text-gray-900">{category.name}</span>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
