export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
}

export type CustomerType = 'Direct Customer' | 'Organization-Based Customer';

export interface CustomerOrganizationMeta {
  customerId: number | string;
  customerType: CustomerType;
  organizationId: number | null;
  organizationName: string | null;
  phoneNumber?: string;
  accountStatus?: 'active' | 'pending' | 'inactive';
}

export const INITIAL_ORGANIZATIONS: Organization[] = [
  { id: 1, name: 'Acme Health Systems', slug: 'acme-health', is_active: true, created_at: '2026-01-15T09:00:00Z' },
  { id: 2, name: 'Beacon Mental Health Group', slug: 'beacon-mental-health', is_active: true, created_at: '2026-02-10T11:30:00Z' },
  { id: 3, name: 'CareFirst Wellness Network', slug: 'carefirst-wellness', is_active: true, created_at: '2026-03-01T14:15:00Z' },
  { id: 4, name: 'Horizon Behavioral Health', slug: 'horizon-behavioral', is_active: true, created_at: '2026-03-22T08:45:00Z' },
  { id: 5, name: 'Metro General Healthcare', slug: 'metro-general', is_active: true, created_at: '2026-04-05T10:20:00Z' },
  { id: 6, name: 'St. Jude Wellness Foundation', slug: 'st-jude-wellness', is_active: true, created_at: '2026-05-18T16:00:00Z' },
];

const ORGS_STORAGE_KEY = 'mock_organizations';
const CUSTOMER_META_STORAGE_KEY = 'customer_org_metadata';

// ── Organizations Data Service ───────────────────────────────────────────────

export const getOrganizations = (): Organization[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ORGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse organizations from storage', e);
      }
    }
    // Initialize default organizations if not found
    localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(INITIAL_ORGANIZATIONS));
  }
  return INITIAL_ORGANIZATIONS;
};

export const saveOrganizations = (orgs: Organization[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
  }
};

export const getOrganizationById = (id: number): Organization | undefined => {
  return getOrganizations().find((o) => o.id === id);
};

export const getOrganizationByName = (name: string): Organization | undefined => {
  return getOrganizations().find((o) => o.name.toLowerCase() === name.toLowerCase());
};

// ── Customer Metadata Persistence Service ────────────────────────────────────

// Default seed associations for existing users to showcase both direct and organization customers
export const DEFAULT_CUSTOMER_META: Record<number, CustomerOrganizationMeta> = {
  1: {
    customerId: 1,
    customerType: 'Direct Customer',
    organizationId: null,
    organizationName: null,
    phoneNumber: '+1 (555) 123-4567',
    accountStatus: 'active',
  },
  2: {
    customerId: 2,
    customerType: 'Organization-Based Customer',
    organizationId: 1,
    organizationName: 'Acme Health Systems',
    phoneNumber: '+1 (555) 234-5678',
    accountStatus: 'active',
  },
  3: {
    customerId: 3,
    customerType: 'Direct Customer',
    organizationId: null,
    organizationName: null,
    phoneNumber: '+1 (555) 345-6789',
    accountStatus: 'pending',
  },
  4: {
    customerId: 4,
    customerType: 'Organization-Based Customer',
    organizationId: 2,
    organizationName: 'Beacon Mental Health Group',
    phoneNumber: '+1 (555) 456-7890',
    accountStatus: 'pending',
  },
  5: {
    customerId: 5,
    customerType: 'Organization-Based Customer',
    organizationId: 3,
    organizationName: 'CareFirst Wellness Network',
    phoneNumber: '+1 (555) 567-8901',
    accountStatus: 'active',
  },
  6: {
    customerId: 6,
    customerType: 'Direct Customer',
    organizationId: null,
    organizationName: null,
    phoneNumber: '+1 (555) 678-9012',
    accountStatus: 'active',
  },
};

export const getCustomerMetaMap = (): Record<string | number, CustomerOrganizationMeta> => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CUSTOMER_META_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_CUSTOMER_META, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse customer metadata from storage', e);
      }
    } else {
      localStorage.setItem(CUSTOMER_META_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOMER_META));
    }
  }
  return { ...DEFAULT_CUSTOMER_META };
};

export const getCustomerMeta = (customerId: number | string): CustomerOrganizationMeta => {
  const map = getCustomerMetaMap();
  if (map[customerId]) {
    return map[customerId];
  }
  // Default to Direct Customer if unmapped
  return {
    customerId,
    customerType: 'Direct Customer',
    organizationId: null,
    organizationName: null,
    phoneNumber: '—',
  };
};

export const saveCustomerMeta = (meta: CustomerOrganizationMeta) => {
  if (typeof window !== 'undefined') {
    const map = getCustomerMetaMap();
    map[meta.customerId] = meta;
    localStorage.setItem(CUSTOMER_META_STORAGE_KEY, JSON.stringify(map));
  }
};
