'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { Supplier } from '@/features/suppliers/domain/supplier';

export default function SupplierEditPage() {
  const router = useRouter();
  const params = useParams();
  const session = useAuthStore((state) => state.session);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    business_name: '',
    entity_type: '',
    products_services: '',
    region: '',
    address: '',
    phone: '',
    email: '',
    tin_number: '',
    tender_relevant: false,
    source_directory: '',
    verification_status: 'unverified' as 'unverified' | 'verified' | 'blacklisted',
    notes: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await supplierRepository.getById(params.id as string);
        setSupplier(data);
        setFormData({
          business_name: data.business_name || '',
          entity_type: data.entity_type || '',
          products_services: data.products_services || '',
          region: data.region || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          tin_number: data.tin_number || '',
          tender_relevant: data.tender_relevant || false,
          source_directory: data.source_directory || '',
          verification_status: data.verification_status || 'unverified',
          notes: data.notes || '',
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await supplierRepository.update(params.id as string, formData);
      router.push(`/suppliers/${params.id}`);
    } catch (err) {
      setError((err as Error).message);
      setIsSaving(false);
    }
  };

  if (!session) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Cancel
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Edit Supplier</h1>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-foreground mb-2">
                Business Name *
              </label>
              <input
                id="business_name"
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entity_type" className="block text-sm font-medium text-foreground mb-2">
                  Entity Type
                </label>
                <input
                  id="entity_type"
                  type="text"
                  value={formData.entity_type}
                  onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-foreground mb-2">
                  Region
                </label>
                <input
                  id="region"
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="products_services" className="block text-sm font-medium text-foreground mb-2">
                Products / Services
              </label>
              <textarea
                id="products_services"
                value={formData.products_services}
                onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tin_number" className="block text-sm font-medium text-foreground mb-2">
                  TIN Number
                </label>
                <input
                  id="tin_number"
                  type="text"
                  value={formData.tin_number}
                  onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>

              <div>
                <label htmlFor="verification_status" className="block text-sm font-medium text-foreground mb-2">
                  Verification Status
                </label>
                <select
                  id="verification_status"
                  value={formData.verification_status}
                  onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                >
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="source_directory" className="block text-sm font-medium text-foreground mb-2">
                  Source Directory
                </label>
                <input
                  id="source_directory"
                  type="text"
                  value={formData.source_directory}
                  onChange={(e) => setFormData({ ...formData, source_directory: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="tender_relevant"
                  type="checkbox"
                  checked={formData.tender_relevant}
                  onChange={(e) => setFormData({ ...formData, tender_relevant: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="tender_relevant" className="ml-2 block text-sm text-foreground">
                  Tender Relevant
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
