'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
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

  return (
    <div className="dashboard-layout">
      {/* Top Header Navigation */}
      <nav className="dashboard-nav">
        <div className="dashboard-logo">Video Portal</div>
        <button onClick={handleLogout} className="btn-danger">
          Logout
        </button>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-container">
        <div className="welcome-card">
          <div className="welcome-header">
            <h2>Welcome back, {user.name}!</h2>
            <p>Here is an overview of your account details.</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <p>{user.name}</p>
            </div>
            <div className="info-item">
              <label>Username</label>
              <p>@{user.username}</p>
            </div>
            <div className="info-item">
              <label>Email Address</label>
              <p>{user.email}</p>
            </div>
            <div className="info-item">
              <label>Account ID</label>
              <p>#{user.id}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}