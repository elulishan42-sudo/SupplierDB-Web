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
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
  });

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
    if (!confirm('Are you sure you want to delete this supplier? This will also delete all contacts.')) return;

    try {
      await supplierRepository.delete(params.id as string);
      router.push('/suppliers');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactForm({ name: '', position: '', phone: '', email: '' });
    setShowContactModal(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      position: contact.position || '',
      phone: contact.phone || '',
      email: contact.email || '',
    });
    setShowContactModal(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Delete ${contact.name}?`)) return;
    try {
      await contactRepository.delete(contact.id);
      setContacts(contacts.filter((c) => c.id !== contact.id));
    } catch (err) {
      alert(`Failed to delete contact: ${(err as Error).message}`);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      alert('Name is required');
      return;
    }

    try {
      if (editingContact) {
        const updated = await contactRepository.update(editingContact.id, contactForm);
        setContacts(contacts.map((c) => (c.id === editingContact.id ? updated : c)));
      } else {
        const created = await contactRepository.create({
          ...contactForm,
          supplier_id: params.id as string,
        });
        setContacts([...contacts, created]);
      }
      setShowContactModal(false);
    } catch (err) {
      alert(`Failed to save contact: ${(err as Error).message}`);
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
              onClick={() => router.push('/suppliers')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to Suppliers
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
        {/* Company Info Card */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {supplier.business_name}
              </h1>
              <div className="flex gap-2 text-sm text-muted-foreground">
                {supplier.region && <span>{supplier.region}</span>}
              </div>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                supplier.verification_status === 'verified'
                  ? 'bg-primary/20 text-primary'
                  : supplier.verification_status === 'blacklisted'
                  ? 'bg-destructive/20 text-destructive-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {supplier.verification_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {supplier.entity_type && (
                <p>
                  <span className="font-medium text-foreground">Entity Type:</span>{' '}
                  {supplier.entity_type}
                </p>
              )}
              {supplier.products_services && (
                <p>
                  <span className="font-medium text-foreground">Products/Services:</span>{' '}
                  {supplier.products_services}
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
                  <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                    {supplier.phone}
                  </a>
                </p>
              )}
              {supplier.email && (
                <p>
                  <span className="font-medium text-foreground">Email:</span>{' '}
                  <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                    {supplier.email}
                  </a>
                </p>
              )}
            </div>

            <div className="space-y-3">
              {supplier.tin_number && (
                <p>
                  <span className="font-medium text-foreground">TIN Number:</span>{' '}
                  {supplier.tin_number}
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">Tender Relevant:</span>{' '}
                {supplier.tender_relevant ? 'Yes' : 'No'}
              </p>
              {supplier.source_directory && (
                <p>
                  <span className="font-medium text-foreground">Source Directory:</span>{' '}
                  {supplier.source_directory}
                </p>
              )}
              {supplier.notes && (
                <p>
                  <span className="font-medium text-foreground">Notes:</span>{' '}
                  {supplier.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Persons Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Contact Persons</h2>
            <button
              onClick={handleAddContact}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Contact
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No contact persons yet. Tap "Add Contact" to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-muted rounded-lg p-4 border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{contact.name}</h3>
                      {contact.position && (
                        <p className="text-sm text-muted-foreground">{contact.position}</p>
                      )}
                      <div className="mt-2 space-y-1 text-sm">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            📞 {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            ✉️ {contact.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Position / Role
                </label>
                <input
                  type="text"
                  value={contactForm.position}
                  onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
