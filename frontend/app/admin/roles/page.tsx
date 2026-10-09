'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { Button, Input, Badge } from '../../components/ui/FormComponents';
import Modal from '../../components/ui/Modal';

export interface Permission {
  id: number;
  slug: string;
  description: string | null;
}

export interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  users_count: number;
  permissions: Permission[];
}

interface CurrentUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  match: (slug: string) => boolean;
}

// 7 Defined Modules mapped to database permission slugs
const MODULES: ModuleConfig[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    match: (slug) => slug.startsWith('dashboard:'),
  },
  {
    id: 'customers',
    name: 'Customers',
    icon: '👥',
    match: (slug) => slug.startsWith('customers:'),
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: '📈',
    match: (slug) => slug.startsWith('analytics:'),
  },
  {
    id: 'video_inventory',
    name: 'Video Inventory',
    icon: '🎬',
    match: (slug) => slug.startsWith('videos:') || slug.startsWith('categories:') || slug.startsWith('recommendations:'),
  },
  {
    id: 'organization',
    name: 'Organization',
    icon: '🏢',
    match: (slug) => slug.startsWith('org:') || slug.startsWith('organization:'),
  },
  {
    id: 'user_management',
    name: 'User Management',
    icon: '👤',
    match: (slug) => slug.startsWith('users:'),
  },
  {
    id: 'role_management',
    name: 'Role Management',
    icon: '🛡️',
    match: (slug) => slug.startsWith('roles:'),
  },
];

const PROTECTED_ROLES = ['Super Admin', 'Administrator'];

export default function RoleManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<RoleItem | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permission_ids: number[];
  }>({
    name: '',
    description: '',
    permission_ids: [],
  });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Auth Guard
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const parsed: CurrentUser = JSON.parse(stored);
      if (parsed.role !== 'Super Admin' && parsed.role !== 'Administrator') {
        router.push('/dashboard');
        return;
      }
      setCurrentUser(parsed);
    } catch {
      router.push('/login');
    }
  }, [router]);

  // 2. Fetch Roles and Permissions
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
      ]);

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error('Failed to retrieve role and permission data from server');
      }

      const rolesData: RoleItem[] = await rolesRes.json();
      const permsData: Permission[] = await permsRes.json();

      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      showToast(err.message || 'Error connecting to backend API', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const map: { [moduleId: string]: Permission[] } = {};
    MODULES.forEach((mod) => {
      map[mod.id] = permissions.filter((p) => mod.match(p.slug));
    });
    return map;
  }, [permissions]);

  // Filtered roles by search query
  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        r.permissions.some((p) => p.slug.toLowerCase().includes(query))
    );
  }, [roles, search]);

  // Handler: Open Create Role
  const handleOpenCreate = () => {
    setActiveRole(null);
    setFormData({
      name: '',
      description: '',
      permission_ids: [],
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handler: Open Edit Role
  const handleOpenEdit = (role: RoleItem) => {
    setActiveRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permission_ids: role.permissions.map((p) => p.id),
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handler: Open View Role
  const handleOpenView = (role: RoleItem) => {
    setActiveRole(role);
    setIsViewModalOpen(true);
  };

  // Handler: Open Delete Confirmation
  const handleOpenDelete = (role: RoleItem) => {
    setActiveRole(role);
    setIsDeleteModalOpen(true);
  };

  // Handler: Toggle single permission
  const handleTogglePermission = (permId: number) => {
    setFormData((prev) => {
      const exists = prev.permission_ids.includes(permId);
      const updated = exists
        ? prev.permission_ids.filter((id) => id !== permId)
        : [...prev.permission_ids, permId];
      return { ...prev, permission_ids: updated };
    });
  };

  // Handler: Select All in a Module
  const handleSelectAllModule = (modulePerms: Permission[]) => {
    const moduleIds = modulePerms.map((p) => p.id);
    setFormData((prev) => {
      const newIds = Array.from(new Set([...prev.permission_ids, ...moduleIds]));
      return { ...prev, permission_ids: newIds };
    });
  };

  // Handler: Clear All in a Module
  const handleClearModule = (modulePerms: Permission[]) => {
    const moduleIds = new Set(modulePerms.map((p) => p.id));
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.filter((id) => !moduleIds.has(id)),
    }));
  };

  // Handler: Select All Across Entire System
  const handleSelectAllGlobal = () => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: permissions.map((p) => p.id),
    }));
  };

  // Handler: Clear All Across Entire System
  const handleClearAllGlobal = () => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: [],
    }));
  };

  // Handler: Save Role (Create or Edit)
  const handleSaveRole = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormErrors({ name: 'Role Name is required.' });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const isEditing = Boolean(activeRole);
      const url = isEditing ? `/api/roles/${activeRole!.id}` : '/api/roles';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        name: trimmedName,
        description: formData.description.trim() || null,
        permission_ids: formData.permission_ids,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save role');
      }

      showToast(
        isEditing
          ? `Role '${data.name}' was successfully updated.`
          : `Role '${data.name}' was successfully created.`,
        'success'
      );

      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'An error occurred while saving the role.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Confirm Delete
  const handleConfirmDelete = async () => {
    if (!activeRole) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/roles/${activeRole.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete role');
      }

      showToast(`Role '${activeRole.name}' deleted successfully.`, 'success');
      setIsDeleteModalOpen(false);
      setActiveRole(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Role Management">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border transition-all duration-300 max-w-[90vw] sm:max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <span className="text-base shrink-0">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span className="break-words">{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-4 sm:space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
              <span>Security Roles & Permissions</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                {roles.length} {roles.length === 1 ? 'Role' : 'Roles'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Configure access roles, assign granular module permissions, and inspect user allocations.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-xs font-semibold text-xs sm:text-sm py-2 px-3 sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Role</span>
            </Button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-72 md:w-80">
            <input
              type="text"
              placeholder="Search roles or permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] shadow-xs"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="text-xs text-gray-500 self-start sm:self-auto">
            Showing <strong className="text-gray-800">{filteredRoles.length}</strong> of {roles.length} roles
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 flex flex-col items-center justify-center shadow-xs">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-sm">Loading roles & permissions catalog...</span>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && filteredRoles.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500 shadow-xs">
            <p className="text-base font-semibold text-gray-700">No roles found</p>
            <p className="text-xs sm:text-sm mt-1">Try adjusting your search query or create a new role.</p>
          </div>
        )}

        {/* DESKTOP TABLE VIEW (Screens >= md) */}
        {!isLoading && filteredRoles.length > 0 && (
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role Name
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Permissions
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Users Assigned
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRoles.map((role) => {
                    const isProtected = PROTECTED_ROLES.includes(role.name);
                    return (
                      <tr key={role.id} className="hover:bg-blue-50/20 transition-colors">
                        {/* Role Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {role.name}
                            </span>
                            {isProtected && (
                              <Badge variant="blue">System</Badge>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={role.description || ''}>
                          {role.description || <span className="text-gray-400 italic">No description provided</span>}
                        </td>

                        {/* Assigned Permissions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {role.permissions.length} {role.permissions.length === 1 ? 'Permission' : 'Permissions'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenView(role)}
                              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              View all
                            </button>
                          </div>
                        </td>

                        {/* Users Assigned */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className={`text-sm font-medium ${role.users_count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                              {role.users_count} {role.users_count === 1 ? 'User' : 'Users'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenView(role)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Role Details"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(role)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                              title="Edit Role & Permissions"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(role)}
                              disabled={isProtected}
                              className={`p-1.5 rounded-md transition-colors ${
                                isProtected
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isProtected ? 'System roles cannot be deleted' : 'Delete Role'}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MOBILE & TABLET CARD VIEW (Screens < md) */}
        {!isLoading && filteredRoles.length > 0 && (
          <div className="md:hidden space-y-3">
            {filteredRoles.map((role) => {
              const isProtected = PROTECTED_ROLES.includes(role.name);
              return (
                <div
                  key={role.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3 transition-shadow hover:shadow-sm"
                >
                  {/* Top Bar: Name + Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-gray-900 text-sm">
                          {role.name}
                        </span>
                        {isProtected && <Badge variant="blue">System</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {role.description || <span className="italic text-gray-400">No description provided</span>}
                      </p>
                    </div>

                    {/* Users Badge */}
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{role.users_count}</span>
                    </span>
                  </div>

                  {/* Middle Bar: Permissions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {role.permissions.length} Permissions
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenView(role)}
                      className="text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                      View catalog
                    </button>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleOpenView(role)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(role)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(role)}
                      disabled={isProtected}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                        isProtected
                          ? 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'
                          : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !isSubmitting && setIsFormModalOpen(false)}
        title={activeRole ? `Edit Role: ${activeRole.name}` : 'Create New Role'}
        maxWidth="max-w-4xl"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveRole}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{activeRole ? 'Update Role' : 'Save Role'}</span>
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* General Role Details */}
          <div className="bg-gray-50/80 p-3.5 sm:p-4 rounded-xl border border-gray-200/90 space-y-3 sm:space-y-4">
            <Input
              label="Role Name *"
              placeholder="e.g., Content Editor, Regional Supervisor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              disabled={activeRole?.name === 'Super Admin'}
              className="text-sm"
            />

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Describe the duties and scope of this role..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm shadow-xs placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Permissions Header & Global Controls */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Module Permissions</h4>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Select permissions granted to this role across system modules.
                </p>
              </div>

              {/* Counter & Global Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Selected: {formData.permission_ids.length} of {permissions.length}
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllGlobal}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-50"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAllGlobal}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-0.5 rounded hover:bg-gray-100"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* 7 Grouped Modules */}
            <div className="space-y-3.5 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto pr-1">
              {MODULES.map((module) => {
                const modulePerms = groupedPermissions[module.id] || [];
                const selectedInModule = modulePerms.filter((p) =>
                  formData.permission_ids.includes(p.id)
                ).length;

                return (
                  <div
                    key={module.id}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    {/* Module Header Bar */}
                    <div className="bg-gray-50 px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">{module.icon}</span>
                        <h5 className="text-xs sm:text-sm font-semibold text-gray-800">
                          {module.name}
                        </h5>
                        <span className="text-[11px] sm:text-xs text-gray-500 font-normal">
                          ({selectedInModule} of {modulePerms.length} selected)
                        </span>
                      </div>

                      {/* Module-level Select All / Clear */}
                      {modulePerms.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectAllModule(modulePerms)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-100/50 transition-colors"
                          >
                            Select All
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleClearModule(modulePerms)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-0.5 rounded hover:bg-gray-200/50 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions Checkbox Grid */}
                    <div className="p-3 sm:p-4">
                      {modulePerms.length === 0 ? (
                        <div className="text-xs text-gray-400 italic py-2">
                          No {module.name.toLowerCase()} permissions currently configured in the database catalog.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          {modulePerms.map((perm) => {
                            const isChecked = formData.permission_ids.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 sm:gap-3 p-2.5 rounded-lg border text-xs sm:text-sm cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-blue-50/50 border-blue-200 text-gray-900'
                                    : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-[11px] sm:text-xs font-semibold text-gray-800 break-all">
                                    {perm.slug}
                                  </div>
                                  {perm.description && (
                                    <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 break-words leading-relaxed">
                                      {perm.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* VIEW ROLE OVERVIEW MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={activeRole ? `Role Overview: ${activeRole.name}` : 'Role Overview'}
        maxWidth="max-w-3xl"
        footer={
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsViewModalOpen(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        }
      >
        {activeRole && (
          <div className="space-y-5">
            {/* Summary Card */}
            <div className="bg-gray-50/80 p-3.5 sm:p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Role Name
                </span>
                {PROTECTED_ROLES.includes(activeRole.name) && (
                  <Badge variant="blue">System Role</Badge>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">{activeRole.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {activeRole.description || <span className="italic text-gray-400">No description provided.</span>}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 border-t border-gray-200/60 mt-2">
                <span>
                  Assigned Users: <strong className="text-gray-800">{activeRole.users_count}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Permissions: <strong className="text-gray-800">{activeRole.permissions.length}</strong>
                </span>
              </div>
            </div>

            {/* Granted Permissions by Module */}
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3">
                Granted Module Permissions ({activeRole.permissions.length})
              </h4>

              {activeRole.permissions.length === 0 ? (
                <div className="p-6 text-center text-gray-500 border border-dashed rounded-xl bg-gray-50 text-xs sm:text-sm">
                  This role does not currently have any permissions assigned.
                </div>
              ) : (
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  {MODULES.map((module) => {
                    const grantedInModule = activeRole.permissions.filter((p) =>
                      module.match(p.slug)
                    );
                    if (grantedInModule.length === 0) return null;

                    return (
                      <div
                        key={module.id}
                        className="border border-gray-200 rounded-xl p-3 bg-white"
                      >
                        <div className="flex items-center gap-2 mb-2 font-semibold text-xs sm:text-sm text-gray-800">
                          <span>{module.icon}</span>
                          <span>{module.name}</span>
                          <span className="text-[11px] sm:text-xs font-normal text-gray-500">
                            ({grantedInModule.length} granted)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {grantedInModule.map((perm) => (
                            <span
                              key={perm.id}
                              className="inline-flex flex-col px-2 sm:px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs"
                            >
                              <span className="font-mono font-medium text-[11px] sm:text-xs break-all">{perm.slug}</span>
                              {perm.description && (
                                <span className="text-[10px] text-blue-700 break-words mt-0.5">
                                  {perm.description}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
        title="Delete Role Confirmation"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>Delete Role</span>
            </Button>
          </>
        }
      >
        {activeRole && (
          <div className="space-y-3.5">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="text-base sm:text-lg shrink-0">⚠️</span>
              <div>
                <p className="font-semibold">Are you sure you want to delete this role?</p>
                <p className="mt-1 text-xs text-rose-700">
                  Role: <strong className="font-bold">{activeRole.name}</strong>
                </p>
              </div>
            </div>

            {activeRole.users_count > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                Notice: There are currently <strong>{activeRole.users_count}</strong> user(s) assigned to this role. You must reassign those users before this role can be removed.
              </p>
            )}

            <p className="text-xs text-gray-500 leading-relaxed">
              This action cannot be undone. All assigned permissions for this role will be unlinked.
            </p>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
