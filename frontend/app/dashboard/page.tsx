'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string | null;
  status: string;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        router.push('/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="auth-container">
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  const isAdmin = user.role === 'Super Admin' || user.role === 'Administrator';

  return (
    <div className="dashboard-layout">
      {/* Top Header Navigation */}
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="dashboard-logo">EmotionalVaccine</div>
          <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
            Portal Dashboard
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAdmin && (
            <Link
              href="/admin"
              className="btn-sm"
              style={{
                background: 'var(--primary-color)',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              ⚙️ Super Admin Panel
            </Link>
          )}

          <button onClick={handleLogout} className="btn-danger">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-container">
        {/* Welcome & User Details Card (Goal 6) */}
        <div className="welcome-card" style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Welcome, {user.name}!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Your account is active and approved.
                </p>
              </div>
            </div>

            {/* Role Badge */}
            <div>
              <span
                className="badge badge-role"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                }}
              >
                Role: {user.role || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <p>{user.name}</p>
            </div>

            <div className="info-item">
              <label>Email Address</label>
              <p>{user.email}</p>
            </div>

            <div className="info-item">
              <label>Assigned Role</label>
              <p style={{ color: 'var(--primary-color)' }}>{user.role || 'None'}</p>
            </div>

            <div className="info-item">
              <label>Account Status</label>
              <p style={{ color: '#059669' }}>Approved & Active</p>
            </div>
          </div>
        </div>

        {/* Role Privileges & Workspace Card */}
        <div className="welcome-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Your Role Privileges
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Based on your assigned role (<strong style={{ color: 'var(--text-main)' }}>{user.role}</strong>), you have access to the following capabilities:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-color)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                🎬 Video Portal Library
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Browse, stream, and interact with all approved emotional vaccine resources.
              </div>
            </div>

            {isAdmin && (
              <div
                style={{
                  padding: '1rem',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  background: '#eff6ff',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#1d4ed8' }}>
                  ⚙️ Super Admin Operations
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1e40af', marginBottom: '0.75rem' }}>
                  Manage users, approve pending accounts, assign roles, and toggle access.
                </div>
                <Link
                  href="/admin"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--primary-color)',
                    textDecoration: 'none',
                  }}
                >
                  Go to Super Admin Panel &rarr;
                </Link>
              </div>
            )}

            {(user.role === 'Content Manager' || user.role === 'Manager' || isAdmin) && (
              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-color)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  📁 Content Management
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Upload, curate, and publish emotional vaccine video sequences.
                </div>
              </div>
            )}

            {(user.role === 'Report Viewer' || isAdmin) && (
              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  background: 'var(--bg-color)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  📊 Analytics & Reports
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Access view statistics, user engagement analytics, and report metrics.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}