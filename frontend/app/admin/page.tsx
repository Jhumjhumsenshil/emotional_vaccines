'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserItem {
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

interface CurrentUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'deactivated'>('all');
  const [selectedRoles, setSelectedRoles] = useState<{ [userId: number]: string }>({});
  const [actionLoading, setActionLoading] = useState<{ [userId: number]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Check auth & permissions
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

  // 2. Fetch users and available roles
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/roles'),
      ]);

      if (usersRes.ok && rolesRes.ok) {
        const usersData: UserItem[] = await usersRes.json();
        const rolesData = await rolesRes.json();

        setUsers(usersData);
        setRoles(rolesData);

        // Pre-populate dropdown role selections with their current role or default to 'Content Manager'
        const initialRoles: { [id: number]: string } = {};
        usersData.forEach((u) => {
          initialRoles[u.id] = u.role || 'Content Manager';
        });
        setSelectedRoles(initialRoles);
      } else {
        showToast('Failed to load user management data', 'error');
      }
    } catch {
      showToast('Network error while connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // Handle role assignment and approval (Goal 5)
  const handleAssignRole = async (user: UserItem) => {
    const roleToAssign = selectedRoles[user.id] || 'Content Manager';
    setActionLoading((prev) => ({ ...prev, [user.id]: true }));

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_name: roleToAssign }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update role');
      }

      showToast(`Assigned role "${roleToAssign}" and approved ${user.name}!`, 'success');
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, role: roleToAssign, status: 'approved' } : u
        )
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Handle deactivate / reactivate user (Goal 7)
  const handleToggleStatus = async (user: UserItem) => {
    const newActiveState = !user.is_active;
    setActionLoading((prev) => ({ ...prev, [user.id]: true }));

    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActiveState }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update user status');
      }

      showToast(
        `User ${user.name} has been ${newActiveState ? 'reactivated' : 'deactivated'}.`,
        'success'
      );

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newActiveState } : u))
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Statistics calculation
  const totalCount = users.length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const activeCount = users.filter((u) => u.is_active && u.status === 'approved').length;
  const deactivatedCount = users.filter((u) => !u.is_active).length;

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return u.status === 'pending';
    if (statusFilter === 'approved') return u.status === 'approved' && u.is_active;
    if (statusFilter === 'deactivated') return !u.is_active;
    return true;
  });

  if (!currentUser) {
    return (
      <div className="auth-container">
        <p style={{ color: 'var(--text-muted)' }}>Verifying administrative access...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="dashboard-logo">EmotionalVaccine</div>
          <span className="badge badge-role">Super Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            My User Dashboard
          </Link>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {currentUser.name}
          </div>
          <button onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Admin Dashboard Container */}
      <main className="admin-container">
        {/* Header Title Row */}
        <div className="admin-header-row">
          <div className="admin-title-area">
            <h1>User Management & Approvals</h1>
            <p>
              Review pending registrations, assign roles (Administrator, Content Manager, Report Viewer), and control account status.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="btn-sm"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
            }}
          >
            &#x21bb; Refresh Data
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{totalCount}</div>
            </div>
            <div className="stat-icon icon-blue">👥</div>
          </div>

          <div
            className="stat-card"
            style={{
              borderColor: pendingCount > 0 ? '#fde68a' : 'var(--border-color)',
              backgroundColor: pendingCount > 0 ? '#fffef7' : 'var(--card-bg)',
            }}
          >
            <div className="stat-info">
              <div className="stat-label">Pending Approval</div>
              <div
                className="stat-value"
                style={{ color: pendingCount > 0 ? '#d97706' : 'var(--text-main)' }}
              >
                {pendingCount}
              </div>
            </div>
            <div className="stat-icon icon-amber">⏳</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Active Users</div>
              <div className="stat-value">{activeCount}</div>
            </div>
            <div className="stat-icon icon-emerald">✓</div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Deactivated</div>
              <div className="stat-value">{deactivatedCount}</div>
            </div>
            <div className="stat-icon icon-rose">⛔</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="filter-bar">
          <div className="search-box">
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
              type="text"
              className="search-input"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="tab-pills">
            <button
              className={`tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              className={`tab-pill ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending Approval ({pendingCount})
            </button>
            <button
              className={`tab-pill ${statusFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('approved')}
            >
              Approved ({activeCount})
            </button>
            <button
              className={`tab-pill ${statusFilter === 'deactivated' ? 'active' : ''}`}
              onClick={() => setStatusFilter('deactivated')}
            >
              Deactivated ({deactivatedCount})
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users match the current filter criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Account Status</th>
                    <th>Current Role</th>
                    <th>Assign / Change Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id || user.username === 'admin';
                    const isPending = user.status === 'pending';
                    const isDeactivated = !user.is_active;

                    return (
                      <tr
                        key={user.id}
                        style={{
                          backgroundColor: isPending ? 'rgba(254, 243, 199, 0.25)' : undefined,
                        }}
                      >
                        {/* User Cell */}
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="user-info-name">
                                {user.name}{' '}
                                {isSelf && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}>
                                    (You)
                                  </span>
                                )}
                              </div>
                              <div className="user-info-sub">{user.email}</div>
                              <div
                                style={{
                                  fontSize: '0.725rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '2px',
                                }}
                              >
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td>
                          {isDeactivated ? (
                            <span className="badge badge-deactivated">
                              <span className="badge-dot" /> Deactivated
                            </span>
                          ) : isPending ? (
                            <span className="badge badge-pending">
                              <span className="badge-dot" /> Pending Approval
                            </span>
                          ) : (
                            <span className="badge badge-approved">
                              <span className="badge-dot" /> Approved
                            </span>
                          )}
                        </td>

                        {/* Current Role */}
                        <td>
                          {user.role ? (
                            <span className="badge badge-role">{user.role}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              <em>None (Unassigned)</em>
                            </span>
                          )}
                        </td>

                        {/* Assign Role Dropdown (Goal 5) */}
                        <td>
                          <select
                            className="role-select"
                            value={selectedRoles[user.id] || (user.role || 'Content Manager')}
                            onChange={(e) =>
                              setSelectedRoles({ ...selectedRoles, [user.id]: e.target.value })
                            }
                            disabled={isSelf || actionLoading[user.id]}
                          >
                            <option value="Administrator">Administrator</option>
                            <option value="Content Manager">Content Manager</option>
                            <option value="Report Viewer">Report Viewer</option>
                            <option value="Manager">Manager</option>
                            <option value="Super Admin">Super Admin</option>
                          </select>
                        </td>

                        {/* Actions (Goal 5 & 7) */}
                        <td>
                          <div
                            className="table-actions"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            {/* Approve & Save Role Button */}
                            <button
                              className="btn-sm btn-approve"
                              onClick={() => handleAssignRole(user)}
                              disabled={isSelf || actionLoading[user.id]}
                              title="Assign role and approve user"
                            >
                              {actionLoading[user.id] ? (
                                'Saving...'
                              ) : isPending ? (
                                '✓ Approve & Assign'
                              ) : (
                                'Save Role'
                              )}
                            </button>

                            {/* Deactivate / Reactivate Button */}
                            {!isSelf && (
                              <button
                                className={`btn-sm ${
                                  user.is_active ? 'btn-deactivate' : 'btn-reactivate'
                                }`}
                                onClick={() => handleToggleStatus(user)}
                                disabled={actionLoading[user.id]}
                              >
                                {user.is_active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
