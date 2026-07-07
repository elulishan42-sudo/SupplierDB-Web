'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { contactRepository } from '@/features/contacts/data/contact-repository';
import { Supplier } from '@/features/suppliers/domain/supplier';
import { Contact } from '@/features/contacts/domain/contact';

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [supplierData, contactsData] = await Promise.all([
          supplierRepository.getById(params.id as string),
          contactRepository.forSupplier(params.id as string),
        ]);
        setSupplier(supplierData);
        setContacts(contactsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, router, params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await supplierRepository.delete(params.id as string);
      router.push('/suppliers');
    } catch (err) {
      setError((err as Error).message);
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

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-4 py-3 rounded-md">
            {error || 'Supplier not found'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {supplier.business_name}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Company Information
              </h2>
              <div className="space-y-2">
                {supplier.entity_type && (
                  <p>
                    <span className="font-medium text-foreground">Entity Type:</span>{' '}
                    {supplier.entity_type}
                  </p>
                )}
                {supplier.region && (
                  <p>
                    <span className="font-medium text-foreground">Region:</span>{' '}
                    {supplier.region}
                  </p>
                )}
                {supplier.address && (
                  <p>
                    <span className="font-medium text-foreground">Address:</span>{' '}
                    {supplier.address}
                  </p>
                )}
                {supplier.phone && (
                  <p>
                    <span className="font-medium text-foreground">Phone:</span>{' '}
                    {supplier.phone}
                  </p>
                )}
                {supplier.email && (
                  <p>
                    <span className="font-medium text-foreground">Email:</span>{' '}
                    {supplier.email}
                  </p>
                )}
                {supplier.tin_number && (
                  <p>
                    <span className="font-medium text-foreground">TIN Number:</span>{' '}
                    {supplier.tin_number}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Business Details
              </h2>
              <div className="space-y-2">
                {supplier.products_services && (
                  <p>
                    <span className="font-medium text-foreground">Products/Services:</span>{' '}
                    {supplier.products_services}
                  </p>
                )}
                {supplier.source_directory && (
                  <p>
                    <span className="font-medium text-foreground">Source Directory:</span>{' '}
                    {supplier.source_directory}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground">Tender Relevant:</span>{' '}
                  {supplier.tender_relevant ? 'Yes' : 'No'}
                </p>
                <p>
                  <span className="font-medium text-foreground">Verification Status:</span>{' '}
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      supplier.verification_status === 'verified'
                        ? 'bg-primary/20 text-primary'
                        : supplier.verification_status === 'blacklisted'
                        ? 'bg-destructive/20 text-destructive-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {supplier.verification_status}
                  </span>
                </p>
                {supplier.notes && (
                  <p>
                    <span className="font-medium text-foreground">Notes:</span>{' '}
                    {supplier.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {contacts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mb-4">
                Contacts ({contacts.length})
              </h2>
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-muted rounded-lg p-4 border border-border"
                  >
                    <h3 className="font-medium text-foreground">{contact.name}</h3>
                    {contact.position && (
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    )}
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {contact.phone && <p>Phone: {contact.phone}</p>}
                      {contact.email && <p>Email: {contact.email}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
