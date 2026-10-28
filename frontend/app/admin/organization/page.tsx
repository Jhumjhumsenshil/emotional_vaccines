'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
          { label: 'Logo', value: org.logo_url ? 'Custom logo uploaded' : '— None set' },
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

function OrgLogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') onChange(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const hasLogo = !!value;

  return (
    <div style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
      {/* Label + hint */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Organization Logo
        </label>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Recommended: 200 x 200 px &middot; PNG, JPEG, JPG or SVG &middot; max 2 MB
        </span>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.875rem 1rem',
          border: `2px dashed ${dragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
          borderRadius: 10,
          background: dragging ? 'rgba(99,102,241,0.05)' : '#f9fafb',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          userSelect: 'none',
        }}
      >
        {/* Thumbnail */}
        <div style={{
          width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: '#e5e7eb', border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {hasLogo
            ? <img src={value} alt="Logo thumbnail" style={{ width: 56, height: 56, objectFit: 'cover' }} />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
          }
        </div>

        {/* Instructions */}
        <div style={{ flex: 1 }}>
          {hasLogo ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Logo uploaded
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Click to browse</span>
              {' '}or drag and drop an image here
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {hasLogo ? 'Click anywhere here to replace the current logo' : 'PNG, JPEG, JPG, SVG — max 2 MB'}
          </div>
        </div>

        {/* Preview button */}
        {hasLogo && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
            style={{
              background: 'var(--primary-color, #6366f1)', color: '#fff', border: 'none',
              borderRadius: 6, padding: '0.3rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              flexShrink: 0, letterSpacing: '0.01em',
            }}
          >
            Preview
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="org-form-logo"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Lightbox preview overlay */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 14, padding: '1.5rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
              maxWidth: '90vw',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Logo Preview</div>
            <img
              src={value}
              alt="Logo full preview"
              style={{ maxWidth: 320, maxHeight: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              style={{
                background: '#f3f4f6', color: 'var(--text-main)', border: 'none',
                borderRadius: 6, padding: '0.4rem 1.2rem',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
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

        <Input
          id="org-form-slug"
          label="Slug *"
          placeholder="e.g. acme-health"
          value={form.slug}
          onChange={(e) => onChange('slug', e.target.value)}
          error={errors.slug}
        />

      </div>

      {/* Logo upload with inline preview */}
      <OrgLogoUpload
        value={form.logo_url}
        onChange={(dataUrl) => onChange('logo_url', dataUrl)}
      />

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
  const emptyForm: OrgFormData = { name: '', slug: '', logo_url: '', is_active: true };
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
  const loadOrgs = useCallback(() => {
    setLoading(true);
    const raw = getOrganizations();
    const metaMap = getCustomerMetaMap();

    // Count customers per org by scanning metadata
    const customerCounts: Record<number, number> = {};
    Object.values(metaMap).forEach((meta) => {
      if (meta.organizationId) {
        customerCounts[meta.organizationId] = (customerCounts[meta.organizationId] || 0) + 1;
      }
    });

    // projectCount: read from the Organization record (seeded as mock data).
    // No backend /api/projects or /api/organizations endpoint returns project counts yet.
    // When the API is available, replace `o.projectCount ?? 0` with the fetched value.
    setOrgs(raw.map((o) => ({
      ...o,
      customerCount: customerCounts[o.id] ?? 0,
      projectCount: o.projectCount ?? 0,
    })));
    setLoading(false);
  }, []);

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
    setForm({ name: o.name, slug: o.slug, logo_url: o.logo_url ?? '', is_active: o.is_active });
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
  const handleAdd = () => {
    if (!validateForm(orgs)) return;
    setSaving(true);
    try {
      const existing = getOrganizations();
      const maxId = existing.reduce((m, o) => Math.max(m, o.id), 0);
      const newOrg: Organization = {
        id: maxId + 1,
        name: form.name.trim(),
        slug: form.slug.trim(),
        logo_url: form.logo_url.trim() || undefined,
        is_active: form.is_active,
        projectCount: 0,
        created_at: new Date().toISOString(),
      };
      const updated = [...existing, newOrg];
      saveOrganizations(updated);
      showToast(`Organization "${newOrg.name}" was added.`);
      setShowAddModal(false);
      loadOrgs();
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Organization ──
  const handleEdit = () => {
    if (!editOrg || !validateForm(orgs, editOrg.id)) return;
    setSaving(true);
    try {
      const existing = getOrganizations();
      const updated = existing.map((o) =>
        o.id === editOrg.id
          ? { ...o, name: form.name.trim(), slug: form.slug.trim(), logo_url: form.logo_url.trim() || undefined, is_active: form.is_active }
          : o
      );
      saveOrganizations(updated);
      showToast(`Organization "${form.name}" was updated.`);
      setEditOrg(null);
      loadOrgs();
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Status ──
  const handleToggle = () => {
    if (!toggleOrg) return;
    setSaving(true);
    try {
      const existing = getOrganizations();
      const updated = existing.map((o) =>
        o.id === toggleOrg.id ? { ...o, is_active: !o.is_active } : o
      );
      saveOrganizations(updated);
      const verb = toggleOrg.is_active ? 'deactivated' : 'activated';
      showToast(`Organization "${toggleOrg.name}" was ${verb}.`);
      setToggleOrg(null);
      loadOrgs();
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
