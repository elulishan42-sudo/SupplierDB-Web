'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/application/auth-store';
import { useSupplierListStore } from '@/features/suppliers/application/supplier-list-store';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { contactRepository } from '@/features/contacts/data/contact-repository';
import { productRepository } from '@/features/products/data/product-repository';
import { Supplier } from '@/features/suppliers/domain/supplier';
import { Contact } from '@/features/contacts/domain/contact';
import { Product } from '@/features/products/domain/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  LogOut,
  UserPlus,
  PackagePlus,
  Users,
  Package,
  MapPin,
  Save,
  X,
} from 'lucide-react';

// Split a phone field that may contain several numbers (comma / slash /
// semicolon / pipe / newline separated) into individual numbers so each can be
// rendered on its own line.
function splitPhones(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;/|]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function formatPrice(product: Product): string | null {
  const hasPrice = product.price !== null && product.price !== undefined;
  if (!hasPrice && !product.unit) return null;
  const price = hasPrice ? Number(product.price).toLocaleString() : null;
  if (price && product.unit) return `${price} / ${product.unit}`;
  if (price) return price;
  return product.unit ? `per ${product.unit}` : null;
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
  });

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
  });

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    let cancelled = false;
    const id = params.id as string;

    // Instant paint: reuse the supplier we already have from the list page so
    // the page renders immediately instead of waiting on the network.
    const cached = useSupplierListStore.getState().items.find((s) => s.id === id);
    if (cached) {
      setSupplier(cached);
      setIsLoading(false);
    }

    const loadData = async () => {
      // Fire all three queries in a single parallel wave. Products are
      // non-fatal: if the table hasn't been migrated yet the rest still works.
      const [supplierRes, contactsRes, productsRes] = await Promise.allSettled([
        supplierRepository.getById(id),
        contactRepository.forSupplier(id),
        productRepository.forSupplier(id),
      ]);

      if (cancelled) return;

      if (supplierRes.status === 'fulfilled') {
        setSupplier(supplierRes.value);
      } else if (!cached) {
        setError((supplierRes.reason as Error).message);
      }
      setIsLoading(false);

      if (contactsRes.status === 'fulfilled') {
        setContacts(contactsRes.value);
      } else {
        console.error('Failed to load contacts:', contactsRes.reason);
      }
      setContactsLoading(false);

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value);
      } else {
        console.error('Failed to load products:', productsRes.reason);
      }
      setProductsLoading(false);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [session, router, params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this supplier? This will also delete all contacts and products.')) return;

    try {
      await supplierRepository.delete(params.id as string);
      router.push('/suppliers');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // --- Contacts ---
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

  // --- Products ---
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', price: '', unit: '' });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price !== null && product.price !== undefined ? String(product.price) : '',
      unit: product.unit || '',
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete ${product.name}?`)) return;
    try {
      await productRepository.delete(product.id);
      setProducts(products.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(`Failed to delete product: ${(err as Error).message}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      alert('Name is required');
      return;
    }

    const trimmedPrice = productForm.price.trim();
    const parsedPrice = trimmedPrice === '' ? null : Number(trimmedPrice);
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      alert('Price must be a number');
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || undefined,
      price: parsedPrice,
      unit: productForm.unit.trim() || undefined,
    };

    try {
      if (editingProduct) {
        const updated = await productRepository.update(editingProduct.id, payload);
        setProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)));
      } else {
        const created = await productRepository.create({
          ...payload,
          supplier_id: params.id as string,
        });
        setProducts([...products, created]);
      }
      setShowProductModal(false);
    } catch (err) {
      alert(`Failed to save product: ${(err as Error).message}`);
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

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft />
              Back
            </Button>
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

  const supplierPhones = splitPhones(supplier.phone);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/suppliers')}
            >
              <ArrowLeft />
              Back to Suppliers
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
              >
                <Pencil />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 />
                Delete
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
        {/* Company Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{supplier.business_name}</CardTitle>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {supplier.region && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {supplier.region}
                    </span>
                  )}
                </div>
              </div>
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
          </CardHeader>
          <CardContent>

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
              {supplierPhones.length > 0 && (
                <div>
                  <span className="font-medium text-foreground">Phone:</span>
                  <div className="mt-1 flex flex-col gap-1">
                    {supplierPhones.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone}`}
                        className="text-primary hover:underline inline-flex items-center gap-1.5 w-fit"
                      >
                        <Phone className="size-3.5" />
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {supplier.email && (
                <p>
                  <span className="font-medium text-foreground">Email:</span>{' '}
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-primary hover:underline inline-flex items-center gap-1.5 align-middle"
                  >
                    <Mail className="size-3.5" />
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
          </CardContent>
        </Card>

        {/* Contact Persons + Products side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Contact Persons Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-muted-foreground" />
                  Contact Persons
                </CardTitle>
                <Button onClick={handleAddContact}>
                  <UserPlus />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>

            {contactsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No contact persons yet. Tap &quot;Add Contact&quot; to add one.
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{contact.name}</h3>
                          {contact.position && (
                            <p className="text-sm text-muted-foreground">{contact.position}</p>
                          )}
                          <div className="mt-2 space-y-1 text-sm">
                            {splitPhones(contact.phone).map((phone) => (
                              <a
                                key={phone}
                                href={`tel:${phone}`}
                                className="text-primary hover:underline flex items-center gap-1.5 w-fit"
                              >
                                <Phone className="size-3.5" />
                                {phone}
                              </a>
                            ))}
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-primary hover:underline flex items-center gap-1.5 w-fit"
                              >
                                <Mail className="size-3.5" />
                                {contact.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditContact(contact)}
                            title="Edit"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteContact(contact)}
                            className="text-destructive hover:text-destructive/80"
                            title="Delete"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-5 text-muted-foreground" />
                  Products
                </CardTitle>
                <Button onClick={handleAddProduct}>
                  <PackagePlus />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>

            {productsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : products.length === 0 && !supplier.products_services ? (
              <div className="text-center py-12 text-muted-foreground">
                No products yet. Tap &quot;Add Product&quot; to add one.
              </div>
            ) : products.length === 0 && supplier.products_services ? (
              <div className="text-center py-12 text-muted-foreground">
                {supplier.products_services}
                <p className="mt-2 text-xs">
                  Shown from the legacy description. Use &quot;Add Product&quot; to structure them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const priceLabel = formatPrice(product);
                  return (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-foreground">{product.name}</h3>
                              {priceLabel && <Badge variant="secondary">{priceLabel}</Badge>}
                            </div>
                            {product.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                              title="Edit"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product)}
                              className="text-destructive hover:text-destructive/80"
                              title="Delete"
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContact} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Position / Role</Label>
                  <Input
                    type="text"
                    value={contactForm.position}
                    onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="Separate multiple numbers with a comma"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1"
                  >
                    <X />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      type="text"
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      placeholder="e.g. kg, item, box"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1"
                  >
                    <X />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
