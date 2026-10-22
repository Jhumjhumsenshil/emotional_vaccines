'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/ui/Modal';
import { Input, Select, Button } from '../../components/ui/FormComponents';
import {
  Organization,
  CustomerType,
  getOrganizations,
  getCustomerMetaMap,
  saveCustomerMeta,
} from '../../../services/organizationService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BackendUserItem {
  id: number;
  name: string;
  username: string;
  email: string;
  status: string; // 'pending' | 'approved'
  is_active: boolean;
  role: string | null;
  role_id: number | null;
  created_at: string | null;
}

export interface CustomerItem {
  id: number;
  name: string;
  username: string;
  email: string;
  status: string; // 'pending' | 'approved'
  is_active: boolean;
  role: string | null;
  role_id: number | null;
  created_at: string | null;
  // Organization-based customer properties
  customerType: CustomerType;
  organizationId: number | null;
  organizationName: string | null;
  phoneNumber: string;
}

type SortField = 'id' | 'name' | 'email' | 'customerType' | 'organization' | 'created_at' | 'status';
type SortDir = 'asc' | 'desc';
type CustomerFilter = 'all' | 'active' | 'pending' | 'inactive' | 'direct' | 'organization';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  customerType: CustomerType;
  organizationId: string; // ID string for <select>, or empty for direct customer
  status: 'active' | 'pending' | 'inactive';
  username?: string;
  password?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  username?: string;
  password?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

function getAccountStatus(c: CustomerItem): 'active' | 'pending' | 'inactive' {
  if (!c.is_active) return 'inactive';
  if (c.status === 'pending') return 'pending';
  return 'active';
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg,#3b82f6,#6366f1)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#ef4444,#dc2626)',
    'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    'linear-gradient(135deg,#06b6d4,#0891b2)',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ customer }: { customer: CustomerItem }) {
  const s = getAccountStatus(customer);
  if (s === 'inactive')
    return (
      <span className="badge badge-deactivated" id={`status-badge-${customer.id}`}>
        <span className="badge-dot" /> Inactive
      </span>
    );
  if (s === 'pending')
    return (
      <span className="badge badge-pending" id={`status-badge-${customer.id}`}>
        <span className="badge-dot" /> Pending
      </span>
    );
  return (
    <span className="badge badge-approved" id={`status-badge-${customer.id}`}>
      <span className="badge-dot" /> Active
    </span>
  );
}

function CustomerTypeBadge({ type }: { type: CustomerType }) {
  if (type === 'Direct Customer') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          borderRadius: 9999,
          padding: '0.2rem 0.65rem',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: '0.8rem' }}>👤</span> Direct Customer
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: '#f5f3ff',
        color: '#6d28d9',
        border: '1px solid #ddd6fe',
        borderRadius: 9999,
        padding: '0.2rem 0.65rem',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: '0.8rem' }}>🏢</span> Organization-Based
    </span>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 14"
        fill="none"
        style={{ opacity: 0.3, marginLeft: 4, verticalAlign: 'middle' }}
      >
        <path d="M5 0L1 5h8L5 0zM5 14L1 9h8L5 14z" fill="currentColor" />
      </svg>
    );
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{ color: 'var(--primary-color)', marginLeft: 4, verticalAlign: 'middle' }}
    >
      {sortDir === 'asc' ? (
        <path d="M5 1L1 9h8L5 1z" fill="currentColor" />
      ) : (
        <path d="M5 9L1 1h8L5 9z" fill="currentColor" />
      )}
    </svg>
  );
}

// ─── Customer Detail Panel ─────────────────────────────────────────────────────

function CustomerDetailView({ customer }: { customer: CustomerItem }) {
  const isOrgCustomer = customer.customerType === 'Organization-Based Customer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Avatar + identity block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          className="user-avatar"
          style={{ width: 56, height: 56, fontSize: '1.25rem', background: avatarColor(customer.name) }}
        >
          {initials(customer.name)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>
            {customer.name}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{customer.email}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <CustomerTypeBadge type={customer.customerType} />
            {isOrgCustomer && customer.organizationName && (
              <span
                style={{
                  fontSize: '0.775rem',
                  color: '#4b5563',
                  background: '#f3f4f6',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 6,
                  fontWeight: 500,
                  border: '1px solid #e5e7eb',
                }}
              >
                {customer.organizationName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        {[
          { label: 'Customer ID', value: `#${customer.id}` },
          { label: 'Customer Type', value: customer.customerType },
          {
            label: 'Organization',
            value: isOrgCustomer ? (customer.organizationName ?? '—') : '— None (Direct Customer)',
          },
          { label: 'Phone Number', value: customer.phoneNumber || '—' },
          { label: 'Email Address', value: customer.email },
          { label: 'Username', value: `@${customer.username}` },
          { label: 'Registration Date', value: formatDate(customer.created_at) },
          {
            label: 'Account Status',
            value: getAccountStatus(customer).charAt(0).toUpperCase() + getAccountStatus(customer).slice(1),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              background: '#f9fafb',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                wordBreak: 'break-all',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Note regarding user access and role approvals */}
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          background: '#f9fafb',
          borderRadius: 8,
          padding: '0.65rem 0.875rem',
          border: '1px solid var(--border-color)',
        }}
      >
        To manage administrative portal roles (Administrator, Content Manager, Report Viewer), navigate to{' '}
        <Link href="/admin" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          User Management &amp; Approvals
        </Link>
        .
      </div>
    </div>
  );
}

// ─── Add / Edit Customer Form ──────────────────────────────────────────────────

function CustomerFormPanel({
  form,
  errors,
  organizations,
  isEdit,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: CustomerFormData;
  errors: FormErrors;
  organizations: Organization[];
  isEdit: boolean;
  saving: boolean;
  onChange: (field: keyof CustomerFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const isOrgCustomer = form.customerType === 'Organization-Based Customer';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        {/* Customer Name */}
        <Input
          id="customer-form-name"
          label="Customer Name *"
          placeholder="e.g. Jane Smith"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
        />

        {/* Email Address */}
        <Input
          id="customer-form-email"
          label="Email Address *"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
        />

        {/* Phone Number */}
        <Input
          id="customer-form-phone"
          label="Phone Number"
          placeholder="e.g. +1 (555) 000-0000"
          value={form.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          error={errors.phone}
        />

        {/* Customer Type Dropdown */}
        <Select
          id="customer-form-type"
          label="Customer Type *"
          value={form.customerType}
          onChange={(e) => onChange('customerType', e.target.value)}
        >
          <option value="Direct Customer">Direct Customer</option>
          <option value="Organization-Based Customer">Organization-Based Customer</option>
        </Select>

        {/* Organization Dropdown */}
        {isOrgCustomer ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              id="customer-form-organization"
              label="Organization *"
              value={form.organizationId}
              onChange={(e) => onChange('organizationId', e.target.value)}
              error={errors.organizationId}
            >
              <option value="">— Select an Organization —</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id.toString()}>
                  {org.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              id="customer-form-organization-disabled"
              label="Organization"
              value=""
              disabled
            >
              <option value="">None (Direct Customer)</option>
            </Select>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.75rem', marginBottom: '1rem' }}>
              Direct customers are individual accounts not linked to any organization.
            </p>
          </div>
        )}

        {/* Account Status */}
        <Select
          id="customer-form-status"
          label="Account Status *"
          value={form.status}
          onChange={(e) => onChange('status', e.target.value as 'active' | 'pending' | 'inactive')}
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </Select>

        {/* In Add Mode: Password & Optional Username */}
        {!isEdit && (
          <Input
            id="customer-form-password"
            label="Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password || ''}
            onChange={(e) => onChange('password', e.target.value)}
            error={errors.password}
          />
        )}

        {/* In Edit Mode: Username (disabled display) */}
        {isEdit && (
          <Input
            id="customer-form-username-disabled"
            label="Username"
            value={form.username || ''}
            disabled
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
        <Button id="customer-form-cancel-btn" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button id="customer-form-submit-btn" variant="primary" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / Filter / Sort / Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [orgFilter, setOrgFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [viewCustomer, setViewCustomer] = useState<CustomerItem | null>(null);
  const [editCustomer, setEditCustomer] = useState<CustomerItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const emptyForm: CustomerFormData = {
    name: '',
    email: '',
    phone: '',
    customerType: 'Direct Customer',
    organizationId: '',
    status: 'active',
    username: '',
    password: '',
  };
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Data Fetching ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch available organizations from organization service
      const orgList = getOrganizations();
      setOrganizations(orgList);

      // 2. Fetch users from API
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData: BackendUserItem[] = await usersRes.json();
        const metaMap = getCustomerMetaMap();

        // Merge users with their organization metadata
        const mergedCustomers: CustomerItem[] = usersData.map((u) => {
          const meta = metaMap[u.id];
          let cType: CustomerType = meta?.customerType || 'Direct Customer';
          let orgId = meta?.organizationId ?? null;
          let orgName = meta?.organizationName ?? null;
          let phone = meta?.phoneNumber || '';

          // If orgId is present, verify org name from current org list
          if (orgId) {
            const matchedOrg = orgList.find((o) => o.id === orgId);
            if (matchedOrg) {
              orgName = matchedOrg.name;
            }
          }

          return {
            ...u,
            customerType: cType,
            organizationId: cType === 'Organization-Based Customer' ? orgId : null,
            organizationName: cType === 'Organization-Based Customer' ? orgName : null,
            phoneNumber: phone,
          };
        });

        setCustomers(mergedCustomers);
      } else {
        showToast('Failed to load customer records', 'error');
      }
    } catch {
      showToast('Network error while connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Overview Statistics ──
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => getAccountStatus(c) === 'active').length;
  const pendingCount = customers.filter((c) => getAccountStatus(c) === 'pending').length;
  const inactiveCount = customers.filter((c) => getAccountStatus(c) === 'inactive').length;
  const directCount = customers.filter((c) => c.customerType === 'Direct Customer').length;
  const orgBasedCount = customers.filter((c) => c.customerType === 'Organization-Based Customer').length;

  // ── Filter + Sort + Paginate ──
  const filtered = useMemo(() => {
    let list = customers.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        c.customerType.toLowerCase().includes(q) ||
        (c.organizationName ?? '').toLowerCase().includes(q) ||
        (c.phoneNumber ?? '').toLowerCase().includes(q);

      let matchFilter = true;
      if (customerFilter === 'active') matchFilter = getAccountStatus(c) === 'active';
      else if (customerFilter === 'pending') matchFilter = getAccountStatus(c) === 'pending';
      else if (customerFilter === 'inactive') matchFilter = getAccountStatus(c) === 'inactive';
      else if (customerFilter === 'direct') matchFilter = c.customerType === 'Direct Customer';
      else if (customerFilter === 'organization') matchFilter = c.customerType === 'Organization-Based Customer';

      const matchOrg =
        !orgFilter ||
        (orgFilter === 'direct' && c.customerType === 'Direct Customer') ||
        (c.organizationId?.toString() === orgFilter);

      return matchSearch && matchFilter && matchOrg;
    });

    list = [...list].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortField === 'id') { aVal = a.id; bVal = b.id; }
      else if (sortField === 'name') { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
      else if (sortField === 'email') { aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); }
      else if (sortField === 'customerType') { aVal = a.customerType; bVal = b.customerType; }
      else if (sortField === 'organization') { aVal = (a.organizationName ?? '').toLowerCase(); bVal = (b.organizationName ?? '').toLowerCase(); }
      else if (sortField === 'status') { aVal = getAccountStatus(a); bVal = getAccountStatus(b); }
      else if (sortField === 'created_at') { aVal = a.created_at ?? ''; bVal = b.created_at ?? ''; }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [customers, searchQuery, customerFilter, orgFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, customerFilter, orgFilter]);

  // ── Form helpers ──
  const openAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEdit = (c: CustomerItem) => {
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phoneNumber || '',
      customerType: c.customerType,
      organizationId: c.organizationId ? c.organizationId.toString() : '',
      status: getAccountStatus(c),
      username: c.username,
      password: '',
    });
    setFormErrors({});
    setEditCustomer(c);
  };

  const updateForm = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // When switching customerType to 'Direct Customer', clear organizationId to 'None'
      if (field === 'customerType' && value === 'Direct Customer') {
        next.organizationId = '';
      }
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (isEdit: boolean): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Customer name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';

    // Organization validation: Mandatory for organization-based customers
    if (form.customerType === 'Organization-Based Customer') {
      if (!form.organizationId || form.organizationId.trim() === '') {
        errs.organizationId = 'Please select an organization for organization-based customers.';
      }
    }

    if (!isEdit) {
      if (!form.password || !form.password.trim()) {
        errs.password = 'Password is required.';
      } else if (form.password.length < 8) {
        errs.password = 'Password must be at least 8 characters.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Add Customer ──
  const handleAddCustomer = async () => {
    if (!validateForm(false)) return;
    setSaving(true);
    try {
      const desiredUsername = form.username?.trim() || form.email.split('@')[0].trim();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          username: desiredUsername,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create customer');

      const newUserId: number = data.user?.id;

      // Update account status if specified
      if (newUserId && form.status !== 'pending') {
        await fetch(`/api/admin/users/${newUserId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: form.status === 'active',
            status: form.status === 'active' ? 'approved' : 'pending',
          }),
        });
      }

      // Persist customer organization metadata
      const selectedOrg = organizations.find((o) => o.id === Number(form.organizationId));
      saveCustomerMeta({
        customerId: newUserId,
        customerType: form.customerType,
        organizationId: form.customerType === 'Organization-Based Customer' ? Number(form.organizationId) : null,
        organizationName: form.customerType === 'Organization-Based Customer' ? (selectedOrg?.name ?? null) : null,
        phoneNumber: form.phone.trim(),
        accountStatus: form.status,
      });

      showToast(`Customer "${form.name}" was successfully added.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to add customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Customer ──
  const handleEditCustomer = async () => {
    if (!editCustomer || !validateForm(true)) return;
    setSaving(true);
    try {
      const id = editCustomer.id;

      // Update status if changed
      const currentStatus = getAccountStatus(editCustomer);
      if (currentStatus !== form.status) {
        await fetch(`/api/admin/users/${id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: form.status !== 'inactive',
            status: form.status === 'active' ? 'approved' : 'pending',
          }),
        });
      }

      // Save updated organization and profile metadata
      const selectedOrg = organizations.find((o) => o.id === Number(form.organizationId));
      const orgId = form.customerType === 'Organization-Based Customer' ? Number(form.organizationId) : null;
      const orgName = form.customerType === 'Organization-Based Customer' ? (selectedOrg?.name ?? null) : null;

      saveCustomerMeta({
        customerId: id,
        customerType: form.customerType,
        organizationId: orgId,
        organizationName: orgName,
        phoneNumber: form.phone.trim(),
        accountStatus: form.status,
      });

      // Update local state immediately
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phone.trim(),
                customerType: form.customerType,
                organizationId: orgId,
                organizationName: orgName,
                is_active: form.status !== 'inactive',
                status: form.status === 'active' ? 'approved' : 'pending',
              }
            : c
        )
      );

      showToast(`Customer "${form.name}" was successfully updated.`);
      setEditCustomer(null);
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to update customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Customer Management">
      <div className="admin-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>

        {/* ── Header ── */}
        <div className="admin-header-row">
          <div className="admin-title-area">
            <h1>Customer Management</h1>
            <p>
              Manage direct and organization-linked customer accounts, organizational affiliations, and profile details.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              id="refresh-customers-btn"
              onClick={fetchData}
              className="btn-sm"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            >
              ↻ Refresh
            </button>
            <button
              id="add-customer-btn"
              onClick={openAdd}
              className="btn-sm btn-approve"
              style={{ gap: '0.4rem' }}
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="stats-grid">
          <div className="stat-card" id="stat-total-customers">
            <div className="stat-info">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{loading ? '—' : totalCount}</div>
            </div>
            <div className="stat-icon icon-blue">👥</div>
          </div>

          <div className="stat-card" id="stat-active-customers">
            <div className="stat-info">
              <div className="stat-label">Active Customers</div>
              <div
                className="stat-value"
                style={{ color: activeCount > 0 ? '#047857' : 'var(--text-main)' }}
              >
                {loading ? '—' : activeCount}
              </div>
            </div>
            <div className="stat-icon icon-emerald">✓</div>
          </div>

          <div className="stat-card" id="stat-direct-customers">
            <div className="stat-info">
              <div className="stat-label">Direct Customers</div>
              <div className="stat-value" style={{ color: '#2563eb' }}>
                {loading ? '—' : directCount}
              </div>
            </div>
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              👤
            </div>
          </div>

          <div className="stat-card" id="stat-org-customers">
            <div className="stat-info">
              <div className="stat-label">Organization Customers</div>
              <div className="stat-value" style={{ color: '#7c3aed' }}>
                {loading ? '—' : orgBasedCount}
              </div>
            </div>
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              🏢
            </div>
          </div>
        </div>

        {/* ── Filter & Search Bar ── */}
        <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Search */}
          <div className="search-box" style={{ minWidth: 220, flex: 1 }}>
            <svg
              className="search-icon-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="customer-search"
              type="text"
              className="search-input"
              placeholder="Search by name, email, ID, organization, or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Organization filter */}
          <select
            id="customer-org-filter"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              background: '#fff',
              color: 'var(--text-main)',
              minWidth: 180,
              outline: 'none',
            }}
          >
            <option value="">All Organizations</option>
            <option value="direct">Direct Customers Only</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id.toString()}>
                {org.name}
              </option>
            ))}
          </select>

          {/* Customer type and status filter tabs */}
          <div className="tab-pills">
            {(
              [
                { key: 'all', label: `All (${totalCount})` },
                { key: 'direct', label: `Direct (${directCount})` },
                { key: 'organization', label: `Org-Based (${orgBasedCount})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'pending', label: `Pending (${pendingCount})` },
              ] as { key: CustomerFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                id={`filter-${key}`}
                className={`tab-pill ${customerFilter === key ? 'active' : ''}`}
                onClick={() => setCustomerFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Customer Table ── */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⏳</div>
              Loading customer records…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <div
                style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}
              >
                No customers found
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {searchQuery || customerFilter !== 'all' || orgFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No customers are registered yet. Click "+ Add Customer" to get started.'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-table" id="customer-table">
                  <thead>
                    <tr>
                      {(
                        [
                          { key: 'id', label: 'Customer ID' },
                          { key: 'name', label: 'Customer Name' },
                          { key: 'email', label: 'Email' },
                          { key: 'customerType', label: 'Customer Type' },
                          { key: 'organization', label: 'Organization' },
                          { key: 'created_at', label: 'Registration Date' },
                          { key: 'status', label: 'Account Status' },
                        ] as { key: SortField; label: string }[]
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          id={`col-${key}`}
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleSort(key)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {label}
                            <SortIcon field={key} sortField={sortField} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c) => {
                      const isDirect = c.customerType === 'Direct Customer';
                      return (
                        <tr key={c.id} id={`customer-row-${c.id}`}>
                          {/* Customer ID */}
                          <td
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            #{c.id}
                          </td>

                          {/* Customer Name */}
                          <td>
                            <div className="user-cell">
                              <div
                                className="user-avatar"
                                style={{ background: avatarColor(c.name) }}
                              >
                                {initials(c.name)}
                              </div>
                              <div>
                                <div className="user-info-name">{c.name}</div>
                                {c.phoneNumber && (
                                  <div className="user-info-sub" style={{ fontSize: '0.75rem' }}>
                                    {c.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {c.email}
                          </td>

                          {/* Customer Type */}
                          <td id={`customer-type-${c.id}`}>
                            <CustomerTypeBadge type={c.customerType} />
                          </td>

                          {/* Organization */}
                          <td id={`customer-org-${c.id}`}>
                            {isDirect ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                            ) : (
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#374151',
                                  fontSize: '0.85rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                🏢 {c.organizationName || 'Assigned'}
                              </span>
                            )}
                          </td>

                          {/* Registration Date */}
                          <td
                            style={{
                              fontSize: '0.825rem',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatDate(c.created_at)}
                          </td>

                          {/* Account Status */}
                          <td>
                            <StatusBadge customer={c} />
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                id={`view-btn-${c.id}`}
                                className="btn-sm"
                                title="View customer profile"
                                onClick={() => setViewCustomer(c)}
                                style={{
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                View
                              </button>
                              <button
                                id={`edit-btn-${c.id}`}
                                className="btn-sm"
                                title="Edit customer profile"
                                onClick={() => openEdit(c)}
                                style={{
                                  background: 'var(--card-bg)',
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-main)',
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}{' '}
                    customers
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      id="prev-page-btn"
                      className="btn-sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                      }}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                      )
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (
                          idx > 0 &&
                          typeof arr[idx - 1] === 'number' &&
                          (p as number) - (arr[idx - 1] as number) > 1
                        )
                          acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} style={{ padding: '0.4rem 0.5rem' }}>
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            id={`page-btn-${p}`}
                            className="btn-sm"
                            onClick={() => setCurrentPage(p as number)}
                            style={{
                              background:
                                currentPage === p ? 'var(--primary-color)' : 'var(--card-bg)',
                              color: currentPage === p ? '#fff' : 'var(--text-main)',
                              border: `1px solid ${
                                currentPage === p
                                  ? 'var(--primary-color)'
                                  : 'var(--border-color)'
                              }`,
                              fontWeight: currentPage === p ? 700 : 500,
                            }}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      id="next-page-btn"
                      className="btn-sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {/* Row count (no pagination needed) */}
              {totalPages === 1 && filtered.length > 0 && (
                <div
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {filtered.length} customer{filtered.length !== 1 ? 's' : ''} shown
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ════ MODALS ════ */}

      {/* View Customer Profile */}
      <Modal
        isOpen={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        title="Customer Profile"
        maxWidth="max-w-lg"
        footer={
          <Button id="close-view-customer-btn" variant="secondary" onClick={() => setViewCustomer(null)}>
            Close
          </Button>
        }
      >
        {viewCustomer && <CustomerDetailView customer={viewCustomer} />}
      </Modal>

      {/* Add Customer */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Customer"
        maxWidth="max-w-2xl"
      >
        <CustomerFormPanel
          form={form}
          errors={formErrors}
          organizations={organizations}
          isEdit={false}
          saving={saving}
          onChange={updateForm}
          onSubmit={handleAddCustomer}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Customer Profile */}
      <Modal
        isOpen={!!editCustomer}
        onClose={() => setEditCustomer(null)}
        title={`Edit Customer — ${editCustomer?.name ?? ''}`}
        maxWidth="max-w-2xl"
      >
        <CustomerFormPanel
          form={form}
          errors={formErrors}
          organizations={organizations}
          isEdit={true}
          saving={saving}
          onChange={updateForm}
          onSubmit={handleEditCustomer}
          onCancel={() => setEditCustomer(null)}
        />
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
