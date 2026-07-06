import { getSupabaseClient } from '@/core/supabase/client';
import { Contact } from '../domain/contact';

const TABLE = 'contacts';

export class ContactRepository {
  private client = getSupabaseClient();

  async forSupplier(supplierId: string): Promise<Contact[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .eq('supplier_id', supplierId)
      .order('created_at');

    if (error) throw error;
    return data as Contact[];
  }

  async create(data: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
    const { data: result, error } = await this.client
      .from(TABLE)
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return result as Contact;
  }

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    const { data: result, error } = await this.client
      .from(TABLE)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as Contact;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  async insertMany(rows: Omit<Contact, 'id' | 'created_at'>[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.client.from(TABLE).insert(rows as any);
    if (error) throw error;
  }
}

export const contactRepository = new ContactRepository();
