import { getSupabaseClient } from '@/core/supabase/client';
import { Product } from '../domain/product';

const TABLE = 'products';

export class ProductRepository {
  private client = getSupabaseClient();

  async forSupplier(supplierId: string): Promise<Product[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .eq('supplier_id', supplierId)
      .order('created_at');

    if (error) throw error;
    return data as Product[];
  }

  async create(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data: result, error } = await this.client
      .from(TABLE)
      .insert(data as any)
      .select()
      .single();

    if (error) throw error;
    return result as Product;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const { data: result, error } = await (this.client.from(TABLE) as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as Product;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  async insertMany(rows: Omit<Product, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.client.from(TABLE).insert(rows as any);
    if (error) throw error;
  }
}

export const productRepository = new ProductRepository();
