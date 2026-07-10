export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description?: string;
  price?: number | null;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}
