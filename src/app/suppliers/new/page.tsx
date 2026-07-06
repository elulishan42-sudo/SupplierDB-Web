'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';

export default function NewSupplierPage() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

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
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const result = await supplierRepository.insert(formData);
      router.push(`/suppliers/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
      setIsSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Cancel
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Supplier</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                id="business_name"
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entity_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type
                </label>
                <input
                  id="entity_type"
                  type="text"
                  value={formData.entity_type}
                  onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <input
                  id="region"
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="products_services" className="block text-sm font-medium text-gray-700 mb-2">
                Products / Services
              </label>
              <textarea
                id="products_services"
                value={formData.products_services}
                onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tin_number" className="block text-sm font-medium text-gray-700 mb-2">
                  TIN Number
                </label>
                <input
                  id="tin_number"
                  type="text"
                  value={formData.tin_number}
                  onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="verification_status" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  id="verification_status"
                  value={formData.verification_status}
                  onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="source_directory" className="block text-sm font-medium text-gray-700 mb-2">
                  Source Directory
                </label>
                <input
                  id="source_directory"
                  type="text"
                  value={formData.source_directory}
                  onChange={(e) => setFormData({ ...formData, source_directory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="tender_relevant"
                  type="checkbox"
                  checked={formData.tender_relevant}
                  onChange={(e) => setFormData({ ...formData, tender_relevant: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="tender_relevant" className="ml-2 block text-sm text-gray-700">
                  Tender Relevant
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Creating...' : 'Create Supplier'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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
