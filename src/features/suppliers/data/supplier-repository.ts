import { getSupabaseClient } from '@/core/supabase/client';
import { Supplier, SupplierFilters } from '../domain/supplier';

const TABLE = 'suppliers';
const PAGE_SIZE = 30;

export class SupplierRepository {
  private client = getSupabaseClient();

  async fetchPage(page: number, filters: SupplierFilters): Promise<Supplier[]> {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.client.from(TABLE).select();

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.tenderRelevant !== undefined) {
      query = query.eq('tender_relevant', filters.tenderRelevant);
    }
    if (filters.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus);
    }

    const term = filters.search.trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(`business_name.ilike.${pattern},products_services.ilike.${pattern}`);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data as Supplier[];
  }

  async getById(id: string): Promise<Supplier> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Supplier;
  }

  async insert(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const { data: result, error } = await this.client
      .from(TABLE)
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return result as Supplier;
  }

  async insertMany(rows: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>[]): Promise<Supplier[]> {
    if (rows.length === 0) return [];
    const { data, error } = await this.client.from(TABLE).insert(rows as any).select();

    if (error) throw error;
    return (data as any) as Supplier[];
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const { data: result, error } = await (this.client.from(TABLE) as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as Supplier;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  async distinctValues(column: string): Promise<string[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select(column)
      .not(column, 'is', null);

    if (error) throw error;
    const values = new Set<string>();
    (data as any[]).forEach((row) => {
      const v = row[column];
      if (v !== null && typeof v === 'string') {
        values.add(v);
      }
    });
    return Array.from(values).sort();
  }
}

export const supplierRepository = new SupplierRepository();
