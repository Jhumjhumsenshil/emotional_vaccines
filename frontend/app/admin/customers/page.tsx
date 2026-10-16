'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/ui/Modal';
import { Input, Select, Button } from '../../components/ui/FormComponents';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomerItem {
  id: number;
  name: string;
  username: string;
  email: string;
  status: string; // 'pending' | 'approved'
  is_active: boolean;
  role: string | null;  // treated as "customer group" on this page
  role_id: number | null;
  created_at: string | null;
}

interface RoleItem {
  id: number;
  name: string;
  description: string | null;
}

// Customer Management uses "group" terminology for roles.
// "Unassigned" filter means: approved/active customers with no group yet.
type SortField = 'name' | 'email' | 'status' | 'role' | 'created_at' | 'id';
type SortDir = 'asc' | 'desc';
type CustomerFilter = 'all' | 'active' | 'pending' | 'unassigned';

interface CustomerFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
}

interface FormErrors {
  name?: string;
  email?: string;
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ customer }: { customer: CustomerItem }) {
  const s = getAccountStatus(customer);
  if (s === 'inactive')
    return (
      <span className="badge badge-deactivated">
        <span className="badge-dot" /> Inactive
      </span>
    );
  if (s === 'pending')
    return (
      <span className="badge badge-pending">
        <span className="badge-dot" /> Pending
      </span>
    );
  return (
    <span className="badge badge-approved">
      <span className="badge-dot" /> Active
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
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            {customer.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customer.email}</div>
          <div style={{ marginTop: 6 }}>
            {customer.role ? (
              <span className="badge badge-role">{customer.role}</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No group assigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { label: 'Customer ID', value: `#${customer.id}` },
          { label: 'Username', value: `@${customer.username}` },
          { label: 'Email', value: customer.email },
          { label: 'Customer Group', value: customer.role ?? '— Not Assigned' },
          { label: 'Registration Date', value: formatDate(customer.created_at) },
          { label: 'Account Status', value: getAccountStatus(customer).charAt(0).toUpperCase() + getAccountStatus(customer).slice(1) },
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

      {/* Note: account access management lives in User Management */}
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
        To approve, deactivate, or change the system role for this account, go to{' '}
        <Link href="/admin" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          User Management &amp; Approvals
        </Link>
        .
      </div>
    </div>
  );
}

// ─── Add / Edit Customer Form ──────────────────────────────────────────────────
// Note: account status changes (activate/deactivate) belong in User Management.
// This form handles profile fields + group assignment only.

function CustomerFormPanel({
  form,
  errors,
  roles,
  isEdit,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: CustomerFormData;
  errors: FormErrors;
  roles: RoleItem[];
  isEdit: boolean;
  saving: boolean;
  onChange: (field: keyof CustomerFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <Input
          label="Full Name *"
          placeholder="e.g. Jane Smith"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Email Address *"
          type="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Username *"
          placeholder="janesmith"
          value={form.username}
          onChange={(e) => onChange('username', e.target.value)}
          error={errors.username}
          disabled={isEdit}
        />
        {!isEdit && (
          <Input
            label="Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            error={errors.password}
          />
        )}
        <div style={{ gridColumn: isEdit ? '1 / -1' : 'auto' }}>
          <Select
            label="Customer Group (Role)"
            value={form.role}
            onChange={(e) => onChange('role', e.target.value)}
          >
            <option value="">— No Group —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isEdit && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
          ℹ️ Username cannot be changed. To change account access status, use{' '}
          <Link href="/admin" style={{ color: 'var(--primary-color)' }}>
            User Management &amp; Approvals
          </Link>
          .
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / Filter / Sort / Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [groupFilter, setGroupFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [viewCustomer, setViewCustomer] = useState<CustomerItem | null>(null);
  const [editCustomer, setEditCustomer] = useState<CustomerItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [groupAssignCustomer, setGroupAssignCustomer] = useState<CustomerItem | null>(null);
  const [groupAssignValue, setGroupAssignValue] = useState('');

  // Form state — no "status" field; access control lives in User Management
  const emptyForm: CustomerFormData = { name: '', email: '', username: '', password: '', role: '' };
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
      const [usersRes, rolesRes] = await Promise.all([fetch('/api/admin/users'), fetch('/api/roles')]);
      if (usersRes.ok && rolesRes.ok) {
        const usersData: CustomerItem[] = await usersRes.json();
        const rolesData: RoleItem[] = await rolesRes.json();
        setCustomers(usersData);
        setRoles(rolesData);
      } else {
        showToast('Failed to load customer data', 'error');
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

  // ── Customer-focused Statistics ──
  // These stats reflect the customer population, not the approval queue.
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => getAccountStatus(c) === 'active').length;
  const pendingCount = customers.filter((c) => getAccountStatus(c) === 'pending').length;
  // "Assigned" = approved/active and has a group (role)
  const assignedCount = customers.filter((c) => getAccountStatus(c) === 'active' && !!c.role).length;
  // "Unassigned" = active but no group
  const unassignedCount = customers.filter((c) => getAccountStatus(c) === 'active' && !c.role).length;

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
        (c.role ?? '').toLowerCase().includes(q);

      let matchFilter = true;
      if (customerFilter === 'active') matchFilter = getAccountStatus(c) === 'active';
      else if (customerFilter === 'pending') matchFilter = getAccountStatus(c) === 'pending';
      else if (customerFilter === 'unassigned') matchFilter = getAccountStatus(c) === 'active' && !c.role;

      const matchGroup = !groupFilter || c.role === groupFilter;

      return matchSearch && matchFilter && matchGroup;
    });

    list = [...list].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (sortField === 'id') { aVal = a.id; bVal = b.id; }
      else if (sortField === 'name') { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
      else if (sortField === 'email') { aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); }
      else if (sortField === 'status') { aVal = getAccountStatus(a); bVal = getAccountStatus(b); }
      else if (sortField === 'role') { aVal = (a.role ?? '').toLowerCase(); bVal = (b.role ?? '').toLowerCase(); }
      else if (sortField === 'created_at') { aVal = a.created_at ?? ''; bVal = b.created_at ?? ''; }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [customers, searchQuery, customerFilter, groupFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, customerFilter, groupFilter]);

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
      username: c.username,
      password: '',
      role: c.role ?? '',
    });
    setFormErrors({});
    setEditCustomer(c);
  };

  const updateForm = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (isEdit: boolean): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!isEdit && !form.password.trim()) errs.password = 'Password is required.';
    else if (!isEdit && form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Add Customer ──
  const handleAddCustomer = async () => {
    if (!validateForm(false)) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create customer');

      const newUserId: number = data.user?.id;

      // Assign a group (role) if one was selected
      if (form.role && newUserId) {
        await fetch(`/api/admin/users/${newUserId}/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_name: form.role }),
        });
      }

      showToast(`Customer "${form.name}" was added. Approve their account in User Management.`);
      setShowAddModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to add customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Customer (group/profile only) ──
  const handleEditCustomer = async () => {
    if (!editCustomer || !validateForm(true)) return;
    setSaving(true);
    try {
      const id = editCustomer.id;

      if (form.role) {
        const roleRes = await fetch(`/api/admin/users/${id}/role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_name: form.role }),
        });
        if (!roleRes.ok) {
          const d = await roleRes.json();
          throw new Error(d.detail || 'Failed to update group');
        }
      }

      showToast(`Customer "${form.name}" was updated.`);
      setEditCustomer(null);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, role: form.role || null } : c
        )
      );
    } catch (err: unknown) {
      showToast((err as Error).message || 'Failed to update customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Assign Group ──
  const handleAssignGroup = async () => {
    if (!groupAssignCustomer) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${groupAssignCustomer.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_name: groupAssignValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to assign group');

      showToast(`Group "${groupAssignValue}" assigned to ${groupAssignCustomer.name}.`);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === groupAssignCustomer.id
            ? { ...c, role: groupAssignValue, status: 'approved' }
            : c
        )
      );
      setGroupAssignCustomer(null);
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
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
              Manage customer profiles, group assignments, and video library access.
              For account approvals and role assignments, use{' '}
              <Link href="/admin" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                User Management &amp; Approvals
              </Link>
              .
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

        {/* ── Customer-focused Overview Stats ──
            These reflect customer population, not the approval queue.
            Approval counts are in User Management & Approvals. ── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{loading ? '—' : totalCount}</div>
            </div>
            <div className="stat-icon icon-blue">👥</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Active</div>
              <div
                className="stat-value"
                style={{ color: activeCount > 0 ? '#047857' : 'var(--text-main)' }}
              >
                {loading ? '—' : activeCount}
              </div>
            </div>
            <div className="stat-icon icon-emerald">✓</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Assigned to Group</div>
              <div className="stat-value">{loading ? '—' : assignedCount}</div>
            </div>
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏷️</div>
          </div>

          <div
            className="stat-card"
            style={{
              borderColor: unassignedCount > 0 ? '#fde68a' : 'var(--border-color)',
              backgroundColor: unassignedCount > 0 ? '#fffef7' : 'var(--card-bg)',
            }}
          >
            <div className="stat-info">
              <div className="stat-label">Unassigned</div>
              <div
                className="stat-value"
                style={{ color: unassignedCount > 0 ? '#d97706' : 'var(--text-main)' }}
              >
                {loading ? '—' : unassignedCount}
              </div>
            </div>
            <div className="stat-icon icon-amber">⚠</div>
          </div>
        </div>

        {/* ── Filter & Search Bar ── */}
        <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Search */}
          <div className="search-box" style={{ minWidth: 200, flex: 1 }}>
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
              placeholder="Search by name, email, username, ID, or group…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Group filter */}
          <select
            id="customer-group-filter"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              fontSize: '0.875rem',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              background: '#fff',
              color: 'var(--text-main)',
              minWidth: 160,
              outline: 'none',
            }}
          >
            <option value="">All Groups</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Customer-centric filter tabs */}
          <div className="tab-pills">
            {(
              [
                { key: 'all', label: `All (${totalCount})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'pending', label: `Pending (${pendingCount})` },
                { key: 'unassigned', label: `Unassigned (${unassignedCount})` },
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
              Loading customers…
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
                {searchQuery || customerFilter !== 'all' || groupFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No customers are registered yet. Click "+ Add Customer" to get started.'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      {(
                        [
                          { key: 'id', label: 'ID' },
                          { key: 'name', label: 'Customer' },
                          { key: 'email', label: 'Email' },
                          { key: 'role', label: 'Group' },
                          { key: 'created_at', label: 'Registered' },
                          { key: 'status', label: 'Status' },
                        ] as { key: SortField; label: string }[]
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleSort(key)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {label}
                            <SortIcon field={key} sortField={sortField} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                      {/* Actions column — no Deactivate here; that belongs in User Management */}
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c) => (
                      <tr key={c.id}>
                        {/* ID */}
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
                              <div className="user-info-sub">@{c.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {c.email}
                        </td>

                        {/* Group — the customer-facing concept */}
                        <td>
                          {c.role ? (
                            <span className="badge badge-role">{c.role}</span>
                          ) : (
                            <span
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.8rem',
                                fontStyle: 'italic',
                              }}
                            >
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* Registered */}
                        <td
                          style={{
                            fontSize: '0.825rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDate(c.created_at)}
                        </td>

                        {/* Status */}
                        <td>
                          <StatusBadge customer={c} />
                        </td>

                        {/* Actions — View / Edit profile / Assign Group only.
                            Account access (deactivate/activate/approve) is in User Management. */}
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
                            <button
                              id={`group-btn-${c.id}`}
                              className="btn-sm"
                              title="Assign to customer group"
                              onClick={() => {
                                setGroupAssignCustomer(c);
                                setGroupAssignValue(c.role ?? '');
                              }}
                              style={{
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe',
                              }}
                            >
                              Group
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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

        {/* ── Video Library / Cohort Assignment ──────────────────────────────
            Placeholder for future feature: assign video libraries to customer
            cohorts (groups). This section will expand when the content module
            is connected to the customer group model. ── */}
        <div
          style={{
            marginTop: '1.5rem',
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-color)',
            borderRadius: 12,
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Video Library Assignment
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Coming soon — assign specific video libraries to customer groups (cohorts).
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {roles.length > 0 ? (
              roles.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: 8,
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.8rem',
                    color: '#7c3aed',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>🏷️</span>
                  {r.name}
                  <span style={{ color: '#a78bfa', fontWeight: 400, marginLeft: 4 }}>
                    — {customers.filter((c) => c.role === r.name).length} customers
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No groups configured yet.
              </span>
            )}
          </div>
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
          <Button variant="secondary" onClick={() => setViewCustomer(null)}>
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
          roles={roles}
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
        title={`Edit Profile — ${editCustomer?.name ?? ''}`}
        maxWidth="max-w-2xl"
      >
        <CustomerFormPanel
          form={form}
          errors={formErrors}
          roles={roles}
          isEdit={true}
          saving={saving}
          onChange={updateForm}
          onSubmit={handleEditCustomer}
          onCancel={() => setEditCustomer(null)}
        />
      </Modal>

      {/* Assign Group */}
      <Modal
        isOpen={!!groupAssignCustomer}
        onClose={() => setGroupAssignCustomer(null)}
        title={`Assign Group — ${groupAssignCustomer?.name ?? ''}`}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setGroupAssignCustomer(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignGroup}
              disabled={saving || !groupAssignValue}
            >
              {saving ? 'Saving…' : 'Assign Group'}
            </Button>
          </>
        }
      >
        <div>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            Select a customer group for <strong>{groupAssignCustomer?.name}</strong>. This will
            also approve the account if it is currently pending.
          </p>
          <Select
            label="Customer Group"
            value={groupAssignValue}
            onChange={(e) => setGroupAssignValue(e.target.value)}
          >
            <option value="">— Select a group —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
          {groupAssignCustomer?.role && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
              Currently assigned to: <strong>{groupAssignCustomer.role}</strong>
            </p>
          )}
        </div>
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
