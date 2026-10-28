'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/ui/Modal';
import { Input, Select, Button } from '../../components/ui/FormComponents';
import {
  Organization,
  getOrganizations,
  saveOrganizations,
  getCustomerMetaMap,
} from '../../../services/organizationService';

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// Organization data is currently served from the frontend mock-data service
// (localStorage + INITIAL_ORGANIZATIONS seed). No backend /api/organizations
// endpoint exists yet. Customer counts are derived from the same mock metadata.
// When a real API is available, replace getOrganizations / saveOrganizations
// calls with the appropriate fetch() calls.
// ──────────────────────────────────────────────────────────────────────────────

type SortField = 'id' | 'name' | 'slug' | 'customerCount' | 'projectCount' | 'created_at' | 'is_active';
type SortDir  = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

interface OrgWithCounts extends Organization {
  customerCount: number;
  // projectCount is derived from mock seed data — no backend /api/projects endpoint exists.
  // The schema has projects(org_id FK) but no API currently exposes a count per org.
  projectCount: number;
}

interface OrgFormData {
  name: string;
  description: string;
  slug: string;
  logo_url: string;
  is_active: boolean;
}

interface OrgFormErrors {
  name?: string;
  slug?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function orgInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function orgAvatarGradient(name: string): string {
  const palettes = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#0ea5e9,#2563eb)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#ef4444,#dc2626)',
    'linear-gradient(135deg,#ec4899,#db2777)',
  ];
  return palettes[name.charCodeAt(0) % palettes.length];
}

function OrgAvatar({
  name,
  logoUrl,
  size = 36,
  borderRadius = 8,
}: {
  name: string;
  logoUrl?: string;
  size?: number;
  borderRadius?: number;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const initials = orgInitials(name);
  const bgGradient = orgAvatarGradient(name);

  if (logoUrl && !hasError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
          border: '1px solid var(--border-color, #e5e7eb)',
          flexShrink: 0,
        }}
      >
        <img
          src={logoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        color: '#fff',
        fontWeight: 700,
        fontSize: size >= 50 ? '1.25rem' : '0.85rem',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}

function OrgTableAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  return <OrgAvatar name={name} logoUrl={logoUrl} size={36} borderRadius={8} />;
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field)
    return (
      <svg width="10" height="10" viewBox="0 0 10 14" fill="none"
        style={{ opacity: 0.3, marginLeft: 4, verticalAlign: 'middle' }}>
        <path d="M5 0L1 5h8L5 0zM5 14L1 9h8L5 14z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ color: 'var(--primary-color)', marginLeft: 4, verticalAlign: 'middle' }}>
      {sortDir === 'asc'
        ? <path d="M5 1L1 9h8L5 1z" fill="currentColor" />
        : <path d="M5 9L1 1h8L5 9z" fill="currentColor" />}
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  if (active)
    return (
      <span className="badge badge-approved">
        <span className="badge-dot" /> Active
      </span>
    );
  return (
    <span className="badge badge-deactivated">
      <span className="badge-dot" /> Inactive
    </span>
  );
}

// ─── Organization Detail View ─────────────────────────────────────────────────

function OrgDetailView({ org }: { org: OrgWithCounts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header block */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)',
      }}>
        <OrgAvatar name={org.name} logoUrl={org.logo_url} size={60} borderRadius={14} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>{org.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
            /{org.slug}
          </div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge active={org.is_active} />
          </div>
        </div>
      </div>

      {/* Detail grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        {[
          { label: 'Organization ID', value: `#${org.id}` },
          { label: 'Slug', value: org.slug },
          { label: 'Customers', value: String(org.customerCount) },
          { label: 'Projects (Mock)', value: String(org.projectCount) },
          { label: 'Status', value: org.is_active ? 'Active' : 'Inactive' },
          { label: 'Created On', value: formatDate(org.created_at) },
          { label: 'Logo URL', value: org.logo_url || '— None set' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: '#f9fafb', borderRadius: 8,
            padding: '0.75rem 1rem', border: '1px solid var(--border-color)',
          }}>
            <div style={{
              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Mock data notice */}
      <div style={{
        fontSize: '0.775rem', color: 'var(--text-muted)', background: '#f9fafb',
        borderRadius: 8, padding: '0.6rem 0.875rem', border: '1px solid var(--border-color)',
      }}>
        ℹ️ Organization data is currently managed via frontend mock storage. Real-time sync will be enabled when the backend <code>/api/organizations</code> endpoint is available.
      </div>
    </div>
  );
}

// ─── Organization Form ────────────────────────────────────────────────────────

function OrgLogoPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);

  // Reset broken state whenever the URL changes
  useEffect(() => { setBroken(false); }, [url]);

  if (!url.trim()) return null;

  return (
    <div style={{
      marginTop: '-0.5rem', marginBottom: '1rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.6rem 0.875rem',
      background: '#f9fafb', border: '1px solid var(--border-color)',
      borderRadius: 8,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
        background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600,
      }}>
        {broken
          ? <span style={{ fontSize: '1.25rem' }}>🖼️</span>
          : <img
              src={url}
              alt="Logo preview"
              style={{ width: 40, height: 40, objectFit: 'cover' }}
              onError={() => setBroken(true)}
            />}
      </div>
      <div style={{ fontSize: '0.775rem', color: broken ? '#b91c1c' : 'var(--text-muted)' }}>
        {broken
          ? '⚠️ Could not load logo from this URL. It will still be saved but may not display.'
          : 'Logo preview'}
      </div>
    </div>
  );
}

function OrgFormPanel({
  form, errors, isEdit, saving, onChange, onSubmit, onCancel,
}: {
  form: OrgFormData;
  errors: OrgFormErrors;
  isEdit: boolean;
  saving: boolean;
  onChange: (field: keyof OrgFormData, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            id="org-form-name"
            label="Organization Name *"
            placeholder="e.g. Acme Health Systems"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            error={errors.name}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label htmlFor="org-form-description" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main, #334155)' }}>
              Description
            </label>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)' }}>
              {form.description.length} / 250
            </span>
          </div>

          <textarea
            id="org-form-description"
            name="description"
            rows={3}
            maxLength={250}
            placeholder="Provide a brief summary of the organization's mission or operations..."
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-main, #1e293b)',
              resize: 'vertical',
              minHeight: '80px',
              maxHeight: '200px',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
          />          
          </div>
           
         
        <Input
          id="org-form-slug"
          label="Slug *"
          placeholder="e.g. acme-health"
          value={form.slug}
          onChange={(e) => onChange('slug', e.target.value)}
          error={errors.slug}
        />

        <Input
          id="org-form-logo"
          label="Logo URL"
          placeholder="https://example.com/logo.png"
          value={form.logo_url}
          onChange={(e) => onChange('logo_url', e.target.value)}
          type="url"
        />
        
     </div>

      {/* Live logo preview — appears below the Logo URL field */}
      <OrgLogoPreview url={form.logo_url} />

      <div style={{ marginBottom: '1rem' }}>
        <Select
          id="org-form-status"
          label="Status *"
          value={form.is_active ? 'active' : 'inactive'}
          onChange={(e) => onChange('is_active', e.target.value === 'active')}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        ℹ️ Changes are saved to frontend mock storage until the <code>/api/organizations</code> backend endpoint is integrated.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button id="org-form-cancel-btn" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button id="org-form-submit-btn" variant="primary" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Organization'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganizationPage() {
  const [orgs, setOrgs]               = useState<OrgWithCounts[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField]     = useState<SortField>('created_at');
  const [sortDir, setSortDir]         = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [viewOrg, setViewOrg]   = useState<OrgWithCounts | null>(null);
  const [editOrg, setEditOrg]   = useState<OrgWithCounts | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toggleOrg, setToggleOrg] = useState<OrgWithCounts | null>(null);

  // Form
  const emptyForm: OrgFormData = { name: '', description: '', slug: '', logo_url: '', is_active: true };
  const [form, setForm]         = useState<OrgFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<OrgFormErrors>({});
  const [saving, setSaving]     = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load data ──
// ── Load data ──
const loadOrgs = useCallback(async () => {
  setLoading(true);
  try {
    // 1. Fetch real organization data from your FastAPI backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_BASE_URL}/organizations`);

    if (!response.ok) {
      throw new Error(`Failed to fetch organizations (Status: ${response.status})`);
    }

    const raw: Organization[] = await response.json();

    // 2. Map customer metadata (if still using customer metadata service)
    const metaMap = getCustomerMetaMap();
    const customerCounts: Record<number, number> = {};
    
    Object.values(metaMap).forEach((meta) => {
      if (meta.organizationId) {
        customerCounts[meta.organizationId] = (customerCounts[meta.organizationId] || 0) + 1;
      }
    });

    // 3. Format state with customer & project counts
    setOrgs(
      raw.map((o) => ({
        ...o,
        customerCount: customerCounts[o.id] ?? 0,
        projectCount: o.projectCount ?? 0,
      }))
    );
  } catch (error) {
    console.error('Error fetching organizations:', error);
    showToast('Failed to load organizations from server', 'error');
  } finally {
    setLoading(false);
  }
}, [showToast]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  // ── Stats ──
  const totalCount    = orgs.length;
  const activeCount   = orgs.filter((o) => o.is_active).length;
  const inactiveCount = orgs.filter((o) => !o.is_active).length;
  const totalCustomers = orgs.reduce((acc, o) => acc + o.customerCount, 0);

  // ── Filter / Sort / Paginate ──
  const filtered = useMemo(() => {
    let list = orgs.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || o.name.toLowerCase().includes(q)
        || o.slug.toLowerCase().includes(q)
        || String(o.id).includes(q);
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? o.is_active
          : !o.is_active;
      return matchSearch && matchStatus;
    });

    list = [...list].sort((a, b) => {
      let aV: string | number = '';
      let bV: string | number = '';
      if (sortField === 'id')            { aV = a.id;            bV = b.id; }
      else if (sortField === 'name')     { aV = a.name.toLowerCase(); bV = b.name.toLowerCase(); }
      else if (sortField === 'slug')     { aV = a.slug;          bV = b.slug; }
      else if (sortField === 'customerCount') { aV = a.customerCount; bV = b.customerCount; }
      else if (sortField === 'projectCount')  { aV = a.projectCount;  bV = b.projectCount; }
      else if (sortField === 'created_at') { aV = a.created_at ?? ''; bV = b.created_at ?? ''; }
      else if (sortField === 'is_active')  { aV = a.is_active ? 1 : 0; bV = b.is_active ? 1 : 0; }

      if (aV < bV) return sortDir === 'asc' ? -1 : 1;
      if (aV > bV) return sortDir === 'asc' ? 1  : -1;
      return 0;
    });

    return list;
  }, [orgs, searchQuery, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
    setCurrentPage(1);
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  // ── Form helpers ──
  const openAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEdit = (o: OrgWithCounts) => {
    setForm({ name: o.name, description: o.description ?? '', slug: o.slug, logo_url: o.logo_url ?? '', is_active: o.is_active });
    setFormErrors({});
    setEditOrg(o);
  };

  const updateForm = (field: keyof OrgFormData, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from name when adding
      if (field === 'name' && typeof value === 'string') {
        next.slug = slugify(value);
      }
      return next;
    });
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (existingOrgs: OrgWithCounts[], editingId?: number): boolean => {
    const errs: OrgFormErrors = {};
    if (!form.name.trim()) errs.name = 'Organization name is required.';
    if (!form.slug.trim()) errs.slug = 'Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      errs.slug = 'Slug may only contain lowercase letters, numbers, and hyphens.';
    else {
      const duplicate = existingOrgs.find(
        (o) => o.slug === form.slug.trim() && o.id !== editingId
      );
      if (duplicate) errs.slug = `Slug "${form.slug}" is already in use by "${duplicate.name}".`;
    }
    if (!form.name.trim()) {
      // Check for duplicate name
    } else {
      const dupName = existingOrgs.find(
        (o) => o.name.toLowerCase() === form.name.trim().toLowerCase() && o.id !== editingId
      );
      if (dupName) errs.name = `An organization named "${dupName.name}" already exists.`;
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Add Organization ──
 const handleAdd = async () => {
  if (!validateForm(orgs)) return;
  setSaving(true);

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

    // 1. Send POST request to FastAPI backend
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        slug: form.slug.trim(),
        logo_url: form.logo_url.trim() || null,
        is_active: form.is_active,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add organization');
    }

    const createdOrg = await response.json();

    // 2. Success feedback & UI reset
    showToast(`Organization "${createdOrg.name}" was added successfully.`);
    setShowAddModal(false);

    // 3. Reload list from backend
    loadOrgs();
  } catch (error: any) {
    console.error('Error adding organization:', error);
    showToast(error.message || 'An error occurred while adding organization.', 'error');
  } finally {
    setSaving(false);
  }
};

  // ── Edit Organization ──
  const handleEdit = async () => {
  if (!editOrg || !validateForm(orgs, editOrg.id)) return;
  setSaving(true);

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

    // 1. Send PUT request to FastAPI backend with the organization ID
    const response = await fetch(`${API_BASE_URL}/organizations/${editOrg.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        slug: form.slug.trim(),
        logo_url: form.logo_url.trim() || null,
        is_active: form.is_active,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update organization');
    }

    const updatedOrg = await response.json();

    // 2. Success feedback & UI reset
    showToast(`Organization "${updatedOrg.name}" was updated successfully.`);
    setEditOrg(null);

    // 3. Reload list from backend
    loadOrgs();
  } catch (error: any) {
    console.error('Error updating organization:', error);
    showToast(error.message || 'An error occurred while updating organization.', 'error');
  } finally {
    setSaving(false);
  }
};

  // ── Toggle Status ──
 const handleToggle = async () => {
  if (!toggleOrg) return;
  setSaving(true);

  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    const newActiveStatus = !toggleOrg.is_active;

    // 1. Send PUT request to update only the is_active status (or full payload)
    const response = await fetch(`${API_BASE_URL}/organizations/${toggleOrg.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: toggleOrg.name,
        slug: toggleOrg.slug,
        description: toggleOrg.description || null,
        logo_url: toggleOrg.logo_url || null,
        is_active: newActiveStatus,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to toggle organization status');
    }

    const updatedOrg = await response.json();

    // 2. Success feedback & UI state reset
    const verb = updatedOrg.is_active ? 'activated' : 'deactivated';
    showToast(`Organization "${updatedOrg.name}" was ${verb}.`);
    setToggleOrg(null);

    // 3. Reload list from backend
    loadOrgs();
  } catch (error: any) {
    console.error('Error toggling organization status:', error);
    showToast(error.message || 'An error occurred while changing organization status.', 'error');
  } finally {
    setSaving(false);
  }
};

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Organization Management">
      <div className="admin-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>

        {/* ── Header ── */}
        <div className="admin-header-row">
          <div className="admin-title-area">
            <h1>🏢 Organization Management</h1>
            <p>
              Manage organizations, their status, and associated customer accounts.{' '}
              <span style={{
                fontSize: '0.75rem', background: '#fffbeb', color: '#b45309',
                border: '1px solid #fde68a', borderRadius: 6, padding: '0.15rem 0.5rem',
                fontWeight: 600, marginLeft: 4,
              }}>
                Mock Data
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              id="refresh-orgs-btn"
              onClick={loadOrgs}
              className="btn-sm"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            >
              ↻ Refresh
            </button>
            <button
              id="add-org-btn"
              onClick={openAdd}
              className="btn-sm btn-approve"
            >
              + Add Organization
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          <div className="stat-card" id="stat-total-orgs">
            <div className="stat-info">
              <div className="stat-label">Total Organizations</div>
              <div className="stat-value">{loading ? '—' : totalCount}</div>
            </div>
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>🏢</div>
          </div>

          <div className="stat-card" id="stat-active-orgs">
            <div className="stat-info">
              <div className="stat-label">Active</div>
              <div className="stat-value" style={{ color: '#047857' }}>{loading ? '—' : activeCount}</div>
            </div>
            <div className="stat-icon icon-emerald">✓</div>
          </div>

          <div className="stat-card" id="stat-inactive-orgs">
            <div className="stat-info">
              <div className="stat-label">Inactive</div>
              <div className="stat-value" style={{ color: inactiveCount > 0 ? '#b91c1c' : 'var(--text-main)' }}>
                {loading ? '—' : inactiveCount}
              </div>
            </div>
            <div className="stat-icon icon-rose">⛔</div>
          </div>

          <div className="stat-card" id="stat-org-customers">
            <div className="stat-info">
              <div className="stat-label">Total Org Customers</div>
              <div className="stat-value" style={{ color: '#2563eb' }}>{loading ? '—' : totalCustomers}</div>
            </div>
            <div className="stat-icon icon-blue">👥</div>
          </div>
        </div>

        {/* ── Filter & Search ── */}
        <div className="filter-bar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="search-box" style={{ minWidth: 220, flex: 1 }}>
            <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="org-search"
              type="text"
              className="search-input"
              placeholder="Search by name, slug, or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tab-pills">
            {([
              { key: 'all',      label: `All (${totalCount})` },
              { key: 'active',   label: `Active (${activeCount})` },
              { key: 'inactive', label: `Inactive (${inactiveCount})` },
            ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                id={`filter-org-${key}`}
                className={`tab-pill ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⏳</div>
              Loading organizations…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No organizations found
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No organizations yet. Click "+ Add Organization" to get started.'}
              </div>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-table" id="org-table">
                  <thead>
                    <tr>
                      {([
                        { key: 'id',            label: 'ID' },
                        { key: 'name',          label: 'Organization' },
                        { key: 'slug',          label: 'Slug' },
                        { key: 'projectCount',  label: 'Projects ⚑' },
                        { key: 'customerCount', label: 'Customers' },
                        { key: 'created_at',    label: 'Created' },
                        { key: 'is_active',     label: 'Status' },
                      ] as { key: SortField; label: string }[]).map(({ key, label }) => (
                        <th
                          key={key}
                          id={`col-org-${key}`}
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleSort(key)}
                          title={key === 'projectCount' ? 'Project counts are mock data — no backend API endpoint exists yet' : undefined}
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
                    {paged.map((o) => (
                      <tr key={o.id} id={`org-row-${o.id}`}>
                        {/* ID */}
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          #{o.id}
                        </td>

                        {/* Organization Name */}
                        <td>
                          <div className="user-cell">
                            <OrgTableAvatar name={o.name} logoUrl={o.logo_url} />
                            <div>
                              <div className="user-info-name">{o.name}</div>
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {o.slug}
                        </td>

                        {/* Projects Count (mock data — no API) */}
                        <td id={`org-projects-${o.id}`}>
                          <span
                            title="Project count is mock data — no backend /api/projects endpoint exists yet"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe',
                              borderRadius: 9999, padding: '0.15rem 0.6rem',
                              fontSize: '0.8rem', fontWeight: 700,
                            }}>
                            📁 {o.projectCount}
                          </span>
                        </td>

                        {/* Customer Count */}
                        <td id={`org-customers-${o.id}`}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                            borderRadius: 9999, padding: '0.15rem 0.6rem',
                            fontSize: '0.8rem', fontWeight: 700,
                          }}>
                            👥 {o.customerCount}
                          </span>
                        </td>

                        {/* Created */}
                        <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(o.created_at)}
                        </td>

                        {/* Status */}
                        <td id={`org-status-${o.id}`}>
                          <StatusBadge active={o.is_active} />
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              id={`view-org-btn-${o.id}`}
                              className="btn-sm"
                              title="View organization details"
                              onClick={() => setViewOrg(o)}
                              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                            >
                              View
                            </button>
                            <button
                              id={`edit-org-btn-${o.id}`}
                              className="btn-sm"
                              title="Edit organization"
                              onClick={() => openEdit(o)}
                              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                            >
                              Edit
                            </button>
                            <button
                              id={`toggle-org-btn-${o.id}`}
                              className={`btn-sm ${o.is_active ? 'btn-deactivate' : 'btn-reactivate'}`}
                              title={o.is_active ? 'Deactivate' : 'Activate'}
                              onClick={() => setToggleOrg(o)}
                            >
                              {o.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)',
                  fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem',
                }}>
                  <span>
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      id="org-prev-btn"
                      className="btn-sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        id={`org-page-btn-${p}`}
                        className="btn-sm"
                        onClick={() => setCurrentPage(p)}
                        style={{
                          background: currentPage === p ? 'var(--primary-color)' : 'var(--card-bg)',
                          color:      currentPage === p ? '#fff'                  : 'var(--text-main)',
                          border:     `1px solid ${currentPage === p ? 'var(--primary-color)' : 'var(--border-color)'}`,
                          fontWeight: currentPage === p ? 700 : 500,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      id="org-next-btn"
                      className="btn-sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {totalPages === 1 && filtered.length > 0 && (
                <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {filtered.length} organization{filtered.length !== 1 ? 's' : ''} shown
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ════ MODALS ════ */}

      {/* View */}
      <Modal
        isOpen={!!viewOrg}
        onClose={() => setViewOrg(null)}
        title="Organization Details"
        maxWidth="max-w-lg"
        footer={
          <Button id="close-view-org-btn" variant="secondary" onClick={() => setViewOrg(null)}>
            Close
          </Button>
        }
      >
        {viewOrg && <OrgDetailView org={viewOrg} />}
      </Modal>

      {/* Add */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Organization"
        maxWidth="max-w-xl"
      >
        <OrgFormPanel
          form={form}
          errors={formErrors}
          isEdit={false}
          saving={saving}
          onChange={updateForm}
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit */}
      <Modal
        isOpen={!!editOrg}
        onClose={() => setEditOrg(null)}
        title={`Edit — ${editOrg?.name ?? ''}`}
        maxWidth="max-w-xl"
      >
        <OrgFormPanel
          form={form}
          errors={formErrors}
          isEdit={true}
          saving={saving}
          onChange={updateForm}
          onSubmit={handleEdit}
          onCancel={() => setEditOrg(null)}
        />
      </Modal>

      {/* Toggle Status Confirm */}
      <Modal
        isOpen={!!toggleOrg}
        onClose={() => setToggleOrg(null)}
        title={toggleOrg?.is_active ? 'Deactivate Organization' : 'Activate Organization'}
        maxWidth="max-w-sm"
        footer={
          <>
            <Button id="toggle-org-cancel-btn" variant="secondary" onClick={() => setToggleOrg(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              id="toggle-org-confirm-btn"
              variant={toggleOrg?.is_active ? 'danger' : 'primary'}
              onClick={handleToggle}
              disabled={saving}
            >
              {saving ? 'Saving…' : toggleOrg?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {toggleOrg?.is_active
            ? <>Are you sure you want to deactivate <strong>{toggleOrg?.name}</strong>? It will remain in the system but be marked as inactive.</>
            : <>Are you sure you want to activate <strong>{toggleOrg?.name}</strong>? It will be available for customer association.</>}
        </p>
      </Modal>

      {/* Toast */}
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
