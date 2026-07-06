import { create } from 'zustand';
import Papa from 'papaparse';
import { supplierRepository } from '@/features/suppliers/data/supplier-repository';
import { categoryRepository } from '@/features/categories/data/category-repository';
import { contactRepository } from '@/features/contacts/data/contact-repository';

interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

export const importFields: ImportField[] = [
  { key: 'business_name', label: 'Business name', required: true },
  { key: 'category', label: 'Category (name)', required: false },
  { key: 'entity_type', label: 'Entity type', required: false },
  { key: 'products_services', label: 'Products / services', required: false },
  { key: 'region', label: 'Region', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'phone', label: 'Company phone', required: false },
  { key: 'email', label: 'Company email', required: false },
  { key: 'tin_number', label: 'TIN number', required: false },
  { key: 'tender_relevant', label: 'Tender relevant (yes/no)', required: false },
  { key: 'source_directory', label: 'Source directory', required: false },
  { key: 'verification_status', label: 'Verification status', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'contact_name', label: 'Contact: name', required: false },
  { key: 'contact_position', label: 'Contact: position', required: false },
  { key: 'contact_phone', label: 'Contact: phone', required: false },
  { key: 'contact_email', label: 'Contact: email', required: false },
];

const truthy = new Set(['yes', 'true', '1', 'y', 'relevant']);
const validVerification = new Set(['unverified', 'verified', 'blacklisted']);

const nonSupplierKeys = new Set([
  'category',
  'contact_name',
  'contact_position',
  'contact_phone',
  'contact_email',
]);

// Helper functions
function cell(row: string[], headers: string[], mapping: Record<string, string>, key: string): string | null {
  const mappedHeader = mapping[key];
  if (!mappedHeader) return null;
  const idx = headers.indexOf(mappedHeader);
  if (idx === -1 || idx >= row.length) return null;
  const v = row[idx]?.trim();
  return v === '' ? null : v;
}

function rowToPayload(row: string[], headers: string[], mapping: Record<string, string>): any | null {
  const name = cell(row, headers, mapping, 'business_name');
  if (!name) return null;

  const payload: any = { business_name: name };
  for (const field of importFields) {
    if (field.key === 'business_name' || nonSupplierKeys.has(field.key)) continue;
    const v = cell(row, headers, mapping, field.key);
    if (!v) continue;

    switch (field.key) {
      case 'tender_relevant':
        payload[field.key] = truthy.has(v.toLowerCase());
        break;
      case 'verification_status':
        const s = v.toLowerCase();
        payload[field.key] = validVerification.has(s) ? s : 'unverified';
        break;
      default:
        payload[field.key] = v;
    }
  }
  return payload;
}

function rowToContact(row: string[], headers: string[], mapping: Record<string, string>): any | null {
  const name = cell(row, headers, mapping, 'contact_name');
  if (!name) return null;
  return {
    name,
    position: cell(row, headers, mapping, 'contact_position'),
    phone: cell(row, headers, mapping, 'contact_phone'),
    email: cell(row, headers, mapping, 'contact_email'),
  };
}

interface ImportState {
  csvData: string[][];
  headers: string[];
  mapping: Record<string, string>;
  isParsing: boolean;
  isImporting: boolean;
  progress: number;
  errors: string[];
  result: { inserted: number; contactsInserted: number } | null;
  parseCSV: (file: File) => Promise<void>;
  setMapping: (mapping: Record<string, string>) => void;
  importData: () => Promise<void>;
  reset: () => void;
}

export const useCsvImportStore = create<ImportState>((set, get) => ({
  csvData: [],
  headers: [],
  mapping: {},
  isParsing: false,
  isImporting: false,
  progress: 0,
  errors: [],
  result: null,

  parseCSV: async (file: File) => {
    set({ isParsing: true, errors: [], result: null });
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length === 0) {
            set({ isParsing: false, errors: ['CSV file is empty'] });
            reject(new Error('CSV file is empty'));
            return;
          }
          const headers = data[0];
          const rows = data.slice(1);
          set({ csvData: rows, headers, isParsing: false });
          resolve();
        },
        error: (error) => {
          set({ isParsing: false, errors: [error.message] });
          reject(error);
        },
      });
    });
  },

  setMapping: (mapping) => {
    set({ mapping });
  },

  importData: async () => {
    const { csvData, mapping } = get();
    set({ isImporting: true, errors: [], progress: 0 });

    try {
      const errors: string[] = [];
      const payloads: any[] = [];
      const categoryNames: (string | null)[] = [];
      const contacts: (any | null)[] = [];

      // Build supplier payloads
      for (const row of csvData) {
        const payload = rowToPayload(row, get().headers, mapping);
        if (payload) {
          payloads.push(payload);
          categoryNames.push(cell(row, get().headers, mapping, 'category'));
          contacts.push(rowToContact(row, get().headers, mapping));
        }
      }

      if (payloads.length === 0) {
        set({ isImporting: false, errors: ['No rows with a business name'] });
        return;
      }

      set({ progress: 20 });

      // Resolve/create categories
      const nameToId = new Map<string, string>();
      if (mapping['category']) {
        const categories = await categoryRepository.fetchAll();
        categories.forEach((cat) => nameToId.set(cat.name.toLowerCase(), cat.id));

        const uniqueNames = new Set(categoryNames.filter((n): n is string => n !== null));
        for (const name of uniqueNames) {
          if (!nameToId.has(name.toLowerCase())) {
            try {
              const created = await categoryRepository.create(name);
              nameToId.set(name.toLowerCase(), created.id);
            } catch (e) {
              errors.push(`Category "${name}": ${(e as Error).message}`);
            }
          }
        }
      }

      for (let i = 0; i < payloads.length; i++) {
        const id = nameToId.get(categoryNames[i]?.toLowerCase() || '');
        if (id) payloads[i].category_id = id;
      }

      set({ progress: 40 });

      // Insert suppliers in batches
      const batchSize = 100;
      let inserted = 0;
      const contactRows: any[] = [];

      for (let i = 0; i < payloads.length; i += batchSize) {
        const end = Math.min(i + batchSize, payloads.length);
        const slice = payloads.slice(i, end);
        try {
          const created = await supplierRepository.insertMany(slice);
          inserted += created.length;
          for (let j = 0; j < created.length; j++) {
            const contact = contacts[i + j];
            const supplierId = created[j].id;
            if (contact && supplierId) {
              contactRows.push({ ...contact, supplier_id: supplierId });
            }
          }
          set({ progress: 40 + Math.floor((i / payloads.length) * 40) });
        } catch (e) {
          errors.push(`Rows ${i + 1}-${end}: ${(e as Error).message}`);
        }
      }

      set({ progress: 80 });

      // Insert contacts
      let contactsInserted = 0;
      for (let i = 0; i < contactRows.length; i += batchSize) {
        const end = Math.min(i + batchSize, contactRows.length);
        const slice = contactRows.slice(i, end);
        try {
          await contactRepository.insertMany(slice);
          contactsInserted += slice.length;
        } catch (e) {
          errors.push(`Contacts ${i + 1}-${end}: ${(e as Error).message}`);
        }
      }

      set({
        isImporting: false,
        progress: 100,
        errors,
        result: { inserted, contactsInserted },
      });
    } catch (error) {
      set({
        isImporting: false,
        errors: [(error as Error).message],
      });
    }
  },

  reset: () => {
    set({
      csvData: [],
      headers: [],
      mapping: {},
      isParsing: false,
      isImporting: false,
      progress: 0,
      errors: [],
      result: null,
    });
  },
}));
