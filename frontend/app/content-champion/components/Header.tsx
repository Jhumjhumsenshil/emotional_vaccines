'use client';

import React from 'react';
import elcLogo from '../../assets/elc-logo.png';

interface Champion {
  id: number;
  name: string;
  email: string;
  champion_token: string;
  initials?: string;
}

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  queueCount?: number;
  onMenuClick?: () => void;
  champion?: Champion;
}

export default function Header({ activeTab, setActiveTab, queueCount = 0, onMenuClick, champion }: HeaderProps) {
  const tabs = [
    { id: 'videos',     label: 'Search Videos',        badge: null },
    { id: 'recipients', label: 'Videos for My Recipients', badge: queueCount },
    { id: 'stats',      label: 'Statistics',               badge: null },
  ];

  const initials = champion?.initials || (champion?.name ? champion.name.slice(0, 2).toUpperCase() : 'DE');
  const championName = champion?.name || 'Content Champion';

  return (
    <header className="app-header">
      {/* Top title & profile row */}
      <div className="header-title-bar">
        <div className="header-title-left">
          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 className="header-app-title">Content Champion Video Selector</h1>
        </div>

        {/* Partner Org Logo & User profile on the top row */}
        <div className="header-user-section">
          <div className="header-org-badge" title="Early Learning Coalition of Marine County">
            <img
              src={(elcLogo as any).src || elcLogo}
              alt="Early Learning Coalition of Marine County"
              className="header-org-img"
            />
          </div>

          <div className="header-user-divider" />

          <div className="user-profile">
            <div className="user-info">
              <div className="user-name">{championName}</div>
              <div className="user-org">{champion?.email || 'Content Champion'}</div>
            </div>
            <div className="user-avatar" title="{championName}">{initials}</div>
          </div>
        </div>
      </div>

      {/* Navigation tabs row below */}
      <div className="top-nav">
        <nav className="top-nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="nav-tab-badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}