'use client';

import React, { useState, useEffect } from 'react';

interface Tag {
  id: number;
  name: string;
}

interface KeywordDropdownProps {
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
}

export default function KeywordDropdown({ selectedKeywords, onToggleKeyword }: KeywordDropdownProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE_URL}/videos/tags`);
        if (res.ok) {
          const data = await res.json();
          setTags(data);
        }
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    fetchTags();
  }, []);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {/* Search Input Box */}
      <input
        type="text"
        placeholder="Choose keyword from List"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          borderRadius: '6px 6px 0 0',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          color: '#374151',
          outline: 'none',
        }}
      />

      {/* Scrollable List Box */}
      <div style={{
        maxHeight: '180px',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
      }}>
        {filteredTags.length > 0 ? (
          filteredTags.map((tag, index) => {
            const isSelected = selectedKeywords.includes(tag.name);
            const bgColor = isSelected ? '#e0f2fe' : (index % 2 === 0 ? '#ffffff' : '#fdf8f6');
            
            return (
              <div
                key={tag.id}
                onClick={() => onToggleKeyword(tag.name)}
                style={{
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#1f2937',
                  cursor: 'pointer',
                  backgroundColor: bgColor,
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                {tag.name} {isSelected ? '✓' : ''}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '10px 12px', fontSize: '13px', color: '#9ca3af' }}>No keywords found</div>
        )}
      </div>

      {/* Selected Badges */}
      {selectedKeywords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {selectedKeywords.map((kw) => (
            <span
              key={kw}
              style={{
                fontSize: '12px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid #bfdbfe'
              }}
            >
              {kw}
              <button
                onClick={() => onToggleKeyword(kw)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', fontWeight: 'bold' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}