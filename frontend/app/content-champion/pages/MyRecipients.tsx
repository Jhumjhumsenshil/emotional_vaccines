'use client';

import React, { useState, useEffect } from 'react';
import { FALLBACK_RECIPIENT_VIDEOS, FALLBACK_RECIPIENT_IDS } from '../data/recipientVideos';

interface RecipientItem {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  status: string;
  channelFocus: string;
  assignedVideos: string[];
  avatar: string;
}

interface VideoItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  thumbnail?: string;
  rating?: number;
  languages?: string[];
  [key: string]: any;
}

interface MyRecipientsProps {
  queue?: VideoItem[];
  removedIds?: string[];
  onRemoveVideo?: (id: string) => void;
}

// ── Fallback recipients list ──────────────────────────────────────────────
const FALLBACK_RECIPIENTS: RecipientItem[] = [
  {
    id: "rec-1", name: "Sarah Jenkins", email: "sarah.j@apexmedia.io",
    company: "Apex Community Wellness", role: "Director of Outreach",
    status: "Active", channelFocus: "Families Thrive",
    assignedVideos: ["vid-001", "vid-003", "vid-007"],
    avatar: "https://i.pravatar.cc/120?img=47"
  },
  {
    id: "rec-2", name: "Marcus Vance", email: "m.vance@lumina-agency.com",
    company: "Lumina Health Partners", role: "Community Programs Lead",
    status: "Active", channelFocus: "Self Care",
    assignedVideos: ["vid-002", "vid-004"],
    avatar: "https://i.pravatar.cc/120?img=12"
  },
];

// ── Star Rating ───────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange?: (val: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          width="15" height="15" viewBox="0 0 24 24"
          fill={star <= display ? '#d1d5db' : 'none'}
          stroke="#d1d5db" strokeWidth="1.5"
          style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange && onChange(star)}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ── Add Recipient Modal ───────────────────────────────────────────────────
function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (form: any) => void }) {
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', channelFocus: 'Families Thrive', status: 'Active' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onAdd(form); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div className="modal-title">Add New Recipient</div>
        <div className="modal-sub">Add a wellness partner or media contact to your distribution roster.</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" type="text" required placeholder="e.g. Alex Rivera" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" required placeholder="e.g. alex@wellnessorg.org" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" type="text" placeholder="e.g. WellnessOrg" value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" type="text" placeholder="e.g. Outreach Lead" value={form.role} onChange={e => set('role', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Channel Focus</label>
            <select className="form-input" value={form.channelFocus} onChange={e => set('channelFocus', e.target.value)}>
              {['Families Thrive', 'Self Care', 'Community Support', 'Crisis Resources', 'Youth to Youth'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-teal">Save Recipient</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function MyRecipients({ queue = [], removedIds = [], onRemoveVideo }: MyRecipientsProps) {
  const [recipients, setRecipients] = useState<RecipientItem[]>(FALLBACK_RECIPIENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [langToggles, setLangToggles] = useState<Record<string, boolean>>({});

  // Build the merged video list:
  const newQueueVideos = (queue || []).filter(v => !FALLBACK_RECIPIENT_IDS.has(v.id));
  const baseVideos = [...FALLBACK_RECIPIENT_VIDEOS, ...newQueueVideos];
  const videos = baseVideos.filter(v => !removedIds.includes(v.id));

  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    fetch(`${API_BASE_URL}/api/recipients`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => { if (j.data?.length) setRecipients(j.data); })
      .catch(() => {});
  }, []);

  const handleAdd = (form: any) => {
    const created = { ...form, id: `rec-${Date.now()}`, assignedVideos: [], avatar: `https://i.pravatar.cc/120?u=${encodeURIComponent(form.email)}` };
    setRecipients(r => [created, ...r]);
    setShowAddModal(false);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    fetch(`${API_BASE_URL}/api/recipients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(created) }).catch(() => {});
  };

  const handleRemove = (id: string) => {
    if (onRemoveVideo) onRemoveVideo(id);
  };
  const setRating = (id: string, val: number) => setRatings(r => ({ ...r, [id]: val }));

  const getLangToggle = (videoId: string, lang: string) => {
    const key = `${videoId}-${lang}`;
    if (key in langToggles) return langToggles[key];
    const vid = videos.find(v => v.id === videoId);
    return vid?.languages?.includes(lang) ?? false;
  };

  const toggleLang = (videoId: string, lang: string) => {
    const key = `${videoId}-${lang}`;
    setLangToggles(t => ({ ...t, [key]: !getLangToggle(videoId, lang) }));
  };

  const displayed = sortAlpha
    ? [...videos].sort((a, b) => a.title.localeCompare(b.title))
    : videos;

  return (
    <div>
      {/* Sort buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setSortAlpha(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: '#f97316', color: 'white', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 6h18M7 12h10M11 18h2"/>
          </svg>
          Sort Alpha
        </button>
        <button
          onClick={() => setSortAlpha(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: '#f97316', color: 'white', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          </svg>
          Sort Newest
        </button>
      </div>

      {/* Table */}
      <div className="recipients-table-wrap">
        <table className="recipients-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: 46 }} />
            <col style={{ width: 175 }} />
            <col style={{ width: 145 }} />
            <col style={{ width: 44 }} />
            <col style={{ width: 44 }} />
            <col />
            <col style={{ width: 42 }} />
          </colgroup>
          <thead>
            <tr>
              <th>View</th>
              <th>Title</th>
              <th>My Star Rating</th>
              <th style={{ textAlign: 'center' }}>EN</th>
              <th style={{ textAlign: 'center' }}>SP</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(vid => (
              <tr key={vid.id}>
                {/* Thumbnail */}
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ width: 36, height: 28, borderRadius: 4, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {vid.thumbnail
                      ? <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                    }
                  </div>
                </td>

                {/* Title + category */}
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: 13, lineHeight: 1.3 }}>{vid.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{vid.category}</div>
                </td>

                {/* Stars */}
                <td style={{ padding: '10px 8px' }}>
                  <StarRating value={ratings[vid.id] ?? vid.rating ?? 0} onChange={(val) => setRating(vid.id, val)} />
                </td>

                {/* EN */}
                <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                  <input type="checkbox" checked={getLangToggle(vid.id, 'EN')} onChange={() => toggleLang(vid.id, 'EN')}
                    style={{ accentColor: '#f97316', width: 15, height: 15, cursor: 'pointer' }} />
                </td>

                {/* SP */}
                <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                  <input type="checkbox" checked={getLangToggle(vid.id, 'SP')} onChange={() => toggleLang(vid.id, 'SP')}
                    style={{ accentColor: '#f97316', width: 15, height: 15, cursor: 'pointer' }} />
                </td>

                {/* Description */}
                <td style={{ padding: '10px 8px', fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                  {vid.description}
                </td>

                {/* Remove */}
                <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                  <button
                    onClick={() => handleRemove(vid.id)}
                    title="Remove from list"
                    style={{
                      width: 26, height: 26, borderRadius: 4,
                      background: '#f97316', border: 'none',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {displayed.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <h3>No videos in list</h3>
            <p>Add videos from Search Videos to build your recipients list.</p>
          </div>
        )}
      </div>

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
    </div>
  );
}