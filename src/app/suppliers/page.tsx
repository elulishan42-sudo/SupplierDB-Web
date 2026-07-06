'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useSupplierListStore } from '@/features/suppliers/application/supplier-list-store';
import { Supplier } from '@/features/suppliers/domain/supplier';
import { useCategoriesStore } from '@/features/categories/application/categories-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';

export default function SuppliersPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const {
    items,
    filters,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadFirstPage,
    loadMore,
    refresh,
    applyFilters,
    search,
  } = useSupplierListStore();
  const { categories, loadCategories } = useCategoriesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    categoryId: '',
    entityType: '',
    region: '',
    tenderRelevant: '',
    verificationStatus: '',
  });

  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else {
      loadFirstPage();
      loadCategories();
      loadFilterOptions();
    }
  }, [session, router, loadFirstPage, loadCategories]);

  const loadFilterOptions = async () => {
    try {
      const [regions, entityTypes] = await Promise.all([
        supplierRepository.distinctValues('region'),
        supplierRepository.distinctValues('entity_type'),
      ]);
      setAvailableRegions(regions);
      setAvailableEntityTypes(entityTypes);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    search(value);
  };

  const handleApplyFilters = () => {
    applyFilters({
      ...filters,
      categoryId: localFilters.categoryId || undefined,
      entityType: localFilters.entityType || undefined,
      region: localFilters.region || undefined,
      tenderRelevant: localFilters.tenderRelevant === 'true' ? true : localFilters.tenderRelevant === 'false' ? false : undefined,
      verificationStatus: localFilters.verificationStatus as any || undefined,
    });
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      categoryId: '',
      entityType: '',
      region: '',
      tenderRelevant: '',
      verificationStatus: '',
    });
    applyFilters({
      search: filters.search,
    });
    setShowFilters(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/categories')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Categories
              </button>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search name, products..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span>Filters</span>
              {(localFilters.categoryId || localFilters.entityType || localFilters.region || localFilters.tenderRelevant || localFilters.verificationStatus) && (
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => router.push('/suppliers/new')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Supplier
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={localFilters.categoryId}
                    onChange={(e) => setLocalFilters({ ...localFilters, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                  <select
                    value={localFilters.entityType}
                    onChange={(e) => setLocalFilters({ ...localFilters, entityType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {availableEntityTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={localFilters.region}
                    onChange={(e) => setLocalFilters({ ...localFilters, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {availableRegions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tender Relevant</label>
                  <select
                    value={localFilters.tenderRelevant}
                    onChange={(e) => setLocalFilters({ ...localFilters, tenderRelevant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                  <select
                    value={localFilters.verificationStatus}
                    onChange={(e) => setLocalFilters({ ...localFilters, verificationStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
            <button
              onClick={refresh}
              className="ml-4 text-red-700 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No suppliers found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((supplier: Supplier) => (
                <div
                  key={supplier.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/suppliers/${supplier.id}`)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {supplier.business_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {supplier.region && (
                      <p>
                        <span className="font-medium">Region:</span> {supplier.region}
                      </p>
                    )}
                    {supplier.products_services && (
                      <p className="line-clamp-2">
                        <span className="font-medium">Products:</span>{' '}
                        {supplier.products_services}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          supplier.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : supplier.verification_status === 'blacklisted'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {supplier.verification_status}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
