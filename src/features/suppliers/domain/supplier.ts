export type VerificationStatus = 'unverified' | 'verified' | 'blacklisted';

export interface Supplier {
  id: string;
  business_name: string;
  category_id?: string;
  entity_type?: string;
  products_services?: string;
  region?: string;
  address?: string;
  phone?: string;
  email?: string;
  tin_number?: string;
  tender_relevant: boolean;
  source_directory?: string;
  verification_status: VerificationStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFilters {
  categoryId?: string;
  entityType?: string;
  region?: string;
  tenderRelevant?: boolean;
  verificationStatus?: VerificationStatus;
  search: string;
}

export function createDefaultFilters(): SupplierFilters {
  return {
    search: '',
  };
}

export function hasActiveFilters(filters: SupplierFilters): boolean {
  return !!(
    filters.categoryId ||
    filters.entityType ||
    filters.region ||
    filters.tenderRelevant !== undefined ||
    filters.verificationStatus
  );
}
