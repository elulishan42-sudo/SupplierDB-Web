'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useSupplierListStore } from '@/features/suppliers/application/supplier-list-store';
import { Supplier } from '@/features/suppliers/domain/supplier';
import { useCategoriesStore } from '@/features/categories/application/categories-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, Plus, Tags, LogOut, MapPin, Building2, Package } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="size-6 text-primary" />
              Suppliers
            </h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push('/categories')}
              >
                <Tags />
                Categories
              </Button>
              <Button
                variant="ghost"
                onClick={() => signOut()}
              >
                <LogOut />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search name, products..."
                  className="w-full pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal />
                <span>Filters</span>
                {(localFilters.categoryId || localFilters.entityType || localFilters.region || localFilters.tenderRelevant || localFilters.verificationStatus) && (
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                )}
              </Button>
              <Button
                onClick={() => router.push('/suppliers/new')}
              >
                <Plus />
                Add Supplier
              </Button>
            </div>

            {showFilters && (
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={localFilters.categoryId} onValueChange={(value) => setLocalFilters({ ...localFilters, categoryId: (value as string) ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Entity Type</Label>
                    <Select value={localFilters.entityType} onValueChange={(value) => setLocalFilters({ ...localFilters, entityType: (value as string) ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {availableEntityTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Region</Label>
                    <Select value={localFilters.region} onValueChange={(value) => setLocalFilters({ ...localFilters, region: (value as string) ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {availableRegions.map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tender Relevant</Label>
                    <Select value={localFilters.tenderRelevant} onValueChange={(value) => setLocalFilters({ ...localFilters, tenderRelevant: (value as string) ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Verification Status</Label>
                    <Select value={localFilters.verificationStatus} onValueChange={(value) => setLocalFilters({ ...localFilters, verificationStatus: (value as string) ?? '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
                </div>
              </Card>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md mb-6">
              {error}
              <button
                onClick={refresh}
                className="ml-4 text-destructive-foreground underline hover:text-destructive"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No suppliers found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((supplier: Supplier) => (
                  <Card
                    key={supplier.id}
                    className="hover:border-primary/50 transition-shadow cursor-pointer"
                    onClick={() => router.push(`/suppliers/${supplier.id}`)}
                    onMouseEnter={() => router.prefetch(`/suppliers/${supplier.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {supplier.region && (
                          <p className="text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            {supplier.region}
                          </p>
                        )}
                        {supplier.products_services && (
                          <p className="text-muted-foreground line-clamp-2 flex items-start gap-1.5">
                            <Package className="size-3.5 shrink-0 mt-0.5" />
                            <span>{supplier.products_services}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Status:</span>
                          <Badge
                            variant={
                              supplier.verification_status === 'verified'
                                ? 'default'
                                : supplier.verification_status === 'blacklisted'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {supplier.verification_status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
      </main>
    </div>
  );
}
