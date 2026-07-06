import { getSupabaseClient } from '@/core/supabase/client';
import { Category } from '../domain/category';

const TABLE = 'categories';

export class CategoryRepository {
  private client = getSupabaseClient();

  async fetchAll(): Promise<Category[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select()
      .order('name');

    if (error) throw error;
    return data as Category[];
  }

  async create(name: string): Promise<Category> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({ name } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }
}

export const categoryRepository = new CategoryRepository();
