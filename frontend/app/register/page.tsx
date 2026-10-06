'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          username: formData.username.trim() ? formData.username.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setRegisteredSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {registeredSuccess ? (
          /* Registration Success & Pending Approval Screen */
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                margin: '0 auto 1.25rem',
              }}
            >
              ⏳
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Registration Submitted!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Thank you for signing up, <strong style={{ color: 'var(--text-main)' }}>{formData.name}</strong>.
            </p>

            <div className="pending-banner" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
              <span className="pending-banner-icon">ℹ️</span>
              <div>
                <div className="pending-banner-title">Pending Administrator Approval</div>
                <div className="pending-banner-text">
                  Your account is waiting for Super Admin approval. Once an administrator assigns your role and activates your account, you will be able to log in.
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="btn-primary"
              style={{
                display: 'block',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          /* Registration Form */
          <>
            <div className="auth-header">
              <h1>Create Account</h1>
              <p>Register with your name, email, and password</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="form-control"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">
                  Username <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-control"
                  placeholder="janedoe (defaults to email prefix)"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link href="/login">Sign in here</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}