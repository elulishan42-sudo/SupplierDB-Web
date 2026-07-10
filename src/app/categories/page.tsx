'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useCategoriesStore } from '@/features/categories/application/categories-store';
import { Category } from '@/features/categories/domain/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, LogOut, Plus, Trash2, Tags } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/suppliers')}
              >
                <ArrowLeft />
                Back to Suppliers
              </Button>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Tags className="size-6 text-primary" />
                Categories
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => signOut()}
            >
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="flex gap-4">
              <Input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1"
                disabled={isCreating}
              />
              <Button
                type="submit"
                disabled={isCreating || !newCategoryName.trim()}
              >
                <Plus />
                {isCreating ? 'Adding...' : 'Add Category'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && categories.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No categories found.</p>
          </div>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {categories.map((category: Category) => (
                <li
                  key={category.id}
                  className="px-6 py-4 flex justify-between items-center hover:bg-muted/50"
                >
                  <span className="text-foreground flex items-center gap-2">
                    <Tags className="size-4 text-muted-foreground" />
                    {category.name}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}
