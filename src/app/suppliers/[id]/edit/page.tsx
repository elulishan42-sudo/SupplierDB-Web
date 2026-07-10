'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { Supplier } from '@/features/suppliers/domain/supplier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft />
            Cancel
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Input
                    id="entity_type"
                    type="text"
                    value={formData.entity_type}
                    onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="products_services">Products / Services</Label>
                <Textarea
                  id="products_services"
                  value={formData.products_services}
                  onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tin_number">TIN Number</Label>
                  <Input
                    id="tin_number"
                    type="text"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="verification_status">Verification Status</Label>
                  <Select
                    value={formData.verification_status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, verification_status: ((value as string) ?? 'unverified') as typeof formData.verification_status })
                    }
                  >
                    <SelectTrigger id="verification_status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unverified">Unverified</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="blacklisted">Blacklisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="source_directory">Source Directory</Label>
                  <Input
                    id="source_directory"
                    type="text"
                    value={formData.source_directory}
                    onChange={(e) => setFormData({ ...formData, source_directory: e.target.value })}
                  />
                </div>

                <div className="flex items-center pt-6">
                  <input
                    id="tender_relevant"
                    type="checkbox"
                    checked={formData.tender_relevant}
                    onChange={(e) => setFormData({ ...formData, tender_relevant: e.target.checked })}
                    className="h-4 w-4 accent-primary rounded border-border"
                  />
                  <Label htmlFor="tender_relevant" className="ml-2">
                    Tender Relevant
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving}>
                  <Save />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  <X />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
