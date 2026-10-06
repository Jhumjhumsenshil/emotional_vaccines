'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [status, setStatus] = useState<string>('Connecting...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Unhealthy');
        return res.json();
      })
      .then((data) => {
        setStatus(data.message || 'Connected');
        setIsConnected(true);
      })
      .catch(() => {
        setStatus('Backend disconnected');
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>EmotionalVaccine</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Video Portal & Authentication Platform
          </p>
        </div>

        {/* Backend Status Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '2rem',
            backgroundColor:
              isConnected === true
                ? 'rgba(16, 185, 129, 0.1)'
                : isConnected === false
                ? 'var(--error-bg)'
                : 'rgba(107, 114, 128, 0.1)',
            color:
              isConnected === true
                ? '#059669'
                : isConnected === false
                ? 'var(--error-color)'
                : 'var(--text-muted)',
            border: `1px solid ${
              isConnected === true
                ? 'rgba(16, 185, 129, 0.3)'
                : isConnected === false
                ? 'rgba(239, 68, 68, 0.3)'
                : 'var(--border-color)'
            }`,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                isConnected === true
                  ? '#10b981'
                  : isConnected === false
                  ? '#ef4444'
                  : '#9ca3af',
            }}
          />
          FastAPI: {status}
        </div>

        {/* Action Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/login"
            className="btn-primary"
            style={{
              display: 'block',
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-width',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            style={{
              display: 'block',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background-color 0.2s ease',
            }}
          >
            Create an Account
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginTop: '0.5rem',
            }}
          >
            Go to Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}