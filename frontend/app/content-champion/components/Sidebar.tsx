'use client';

import React, { useState, useEffect } from 'react';
import KeywordDropdown from './KeywordDropdown';

interface Category {
  id: number;
  name: string;
}

interface SidebarProps {
  logoImg?: string;
  onClose?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  selectedCategories?: string[];
  onCategoryChange?: (category: string) => void;
  selectedKeywords?: string[];
  languages?: string[];
  onToggleKeyword?: (keyword: string) => void;
  selectedLanguages?: string[];
  onLanguageChange?: (lang: string) => void;
}

export default function Sidebar({
  logoImg = '',
  onClose = () => {},
  searchTerm = '',
  onSearchChange = () => {},
  selectedCategories = [],
  onCategoryChange = () => {},
  selectedKeywords = [],
  onToggleKeyword = () => {},
  languages = [] as string[],
  selectedLanguages = [],
  onLanguageChange = () => {},
}: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <aside style={{ width: '260px', height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', backgroundColor: '#fff', overflowY: 'auto' }}>
      {/* Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '20px 18px 18px',
        borderBottom: '1px solid #f3f4f6',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoImg && (
            <img
              src={logoImg}
              alt="Emotional Vaccines Logo"
              style={{ width: 38, height: 38, objectFit: 'contain', flexShrink: 0, display: 'block' }}
            />
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4a4a4a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              Emotional<br />
              Vaccines<sup style={{ fontSize: 9, verticalAlign: 'super', fontWeight: 500, color: '#9ca3af' }}>®</sup>
            </div>
            <div style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', letterSpacing: '0.01em', marginTop: 3 }}>
              Resiliency Education
            </div>
          </div>
        </div>

        {/* Close button — mobile only */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="sidebar-filters" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
        {/* Search */}
        <div className="sidebar-search" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Filter by title..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', color: '#374151', backgroundColor: 'transparent' }}
          />
        </div>

        

        {/* Categories Section */}
        <div>
          <h3 className="filter-section-label" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '12px', color: '#374151', textTransform: 'uppercase' }}>Categories</h3>
          {loading ? (
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Loading categories...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat) => (
                <label 
                  key={cat.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#1f2937', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.name)}
                    onChange={() => onCategoryChange(cat.name)}
                    style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

         {/* Languages Section */}
        {languages.length > 0 && (
          <div>
            <h3 className="filter-section-label" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '12px', color: '#374151', textTransform: 'uppercase' }}>Languages</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {languages.map((lang: string) => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#2563eb' : '#f3f4f6',
                      color: isSelected ? '#ffffff' : '#4b5563',
                      borderColor: isSelected ? '#2563eb' : '#d1d5db',
                    }}
                  >
                    {lang === 'EN' ? 'English' : 'Spanish'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular Keywords — dropdown list */}
        <div>
          <div className="filter-section-label" style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '12px', color: '#374151', textTransform: 'uppercase' }}>Popular Keywords</div>
          <KeywordDropdown
            selectedKeywords={selectedKeywords}
            onToggleKeyword={onToggleKeyword}
          />
        </div>
      </div>
    </aside>
  );
}