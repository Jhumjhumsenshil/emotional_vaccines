'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingApproval(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.detail && data.detail.includes('waiting for Super Admin approval')) {
          setIsPendingApproval(true);
        }
        throw new Error(data.detail || 'Login failed. Please check your credentials.');
      }

      // Save user session
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      const userRole = data.user?.role;
      if (userRole === 'Super Admin' || userRole === 'Administrator') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your EmotionalVaccine portal</p>
        </div>

        {/* Pending Approval Banner (Goal 3) */}
        {isPendingApproval && (
          <div className="pending-banner">
            <span className="pending-banner-icon">⏳</span>
            <div>
              <div className="pending-banner-title">Account Approval Pending</div>
              <div className="pending-banner-text">
                Your account is waiting for Super Admin approval. Please check back after an administrator has reviewed and approved your role.
              </div>
            </div>
          </div>
        )}

        {/* Standard Error Banner */}
        {error && !isPendingApproval && (
          <div className="error-banner">
            <strong>Error: </strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username or Email Address</label>
            <input
              id="username"
              type="text"
              required
              className="form-control"
              placeholder="e.g. admin or your@email.com"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link href="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}