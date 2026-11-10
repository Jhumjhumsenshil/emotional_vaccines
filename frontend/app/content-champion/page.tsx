'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SearchVideos from './pages/SearchVideos';
import MyRecipients from './pages/MyRecipients';
import Statistics from './pages/Statistics';
import { FALLBACK_RECIPIENT_VIDEOS, FALLBACK_RECIPIENT_IDS } from './data/recipientVideos';
import './styles/globals.css';
import logoImg from '../assets/logo.png';

interface VideoItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  summary?: string;
  thumbnail?: string;
   rating?: number;
  duration?: string;
  languages?: string[];
  [key: string]: any;
}

const LANGUAGES = ['EN', 'SP'];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('videos');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // ── Sidebar filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

 

const handleLanguageChange = (lang: string) => {
  setSelectedLanguages(prev =>
    prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
  );
};

  const toggleCategory = useCallback((cat: string) =>
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    ), []);

  const toggleLanguage = useCallback((lang: string) =>
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    ), []);

  const toggleKeyword = useCallback((kw: string) =>
    setSelectedKeywords(prev =>
      prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]
    ), []);

  // ── Video Queue (for footer bar + "Added" state) ──────────────────
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const handleAddToQueue = useCallback((video: VideoItem) => {
    setQueue(prev => prev.some(v => v.id === video.id) ? prev : [...prev, video]);
    setRemovedIds(prev => prev.filter(id => id !== video.id));
  }, []);

  const handleRemoveRecipientVideo = useCallback((id: string) => {
    setRemovedIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setQueue(prev => prev.filter(v => v.id !== id));
  }, []);

  // Total count calculation
  const newQueueCount = queue.filter(v => !FALLBACK_RECIPIENT_IDS.has(v.id)).length;
  const removedFallbackCount = removedIds.filter(id => FALLBACK_RECIPIENT_IDS.has(id)).length;
  const removedQueueCount = removedIds.filter(id => !FALLBACK_RECIPIENT_IDS.has(id)).length;
  const recipientsCount = (FALLBACK_RECIPIENT_VIDEOS.length - removedFallbackCount) + (newQueueCount - removedQueueCount);
  const selectedCount = recipientsCount;

  const handleSendVideoLink = () => {
    if (recipientsCount === 0) return;
    alert(`Sharing ${recipientsCount} video(s) with recipients!`);
  };

  // ── Sidebar filter applied to SearchVideos ────────────────────────
  const sidebarFilters = useMemo(() => ({
    search: searchTerm,
    categories: selectedCategories,
    languages: selectedLanguages,
    keywords: selectedKeywords,
  }), [searchTerm, selectedCategories, selectedLanguages, selectedKeywords]);

  return (
    <div className="app-shell">
      {/* Left Sidebar */}
      <Sidebar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategories={selectedCategories}
        onCategoryChange={toggleCategory}
        selectedLanguages={selectedLanguages}
        languages={LANGUAGES}
        selectedKeywords={selectedKeywords}
        onToggleKeyword={toggleKeyword}
        onLanguageChange={toggleLanguage}
        //isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logoImg={typeof logoImg === 'string' ? logoImg : logoImg.src}
      />

      {/* Right: top nav + page body */}
      <div className="main-content">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          queueCount={selectedCount}
          onMenuClick={() => setSidebarOpen(o => !o)}
        />

        <div className="page-body">
          {activeTab === 'videos' && (
            <SearchVideos
              sidebarFilters={sidebarFilters}
              queue={queue}
              onAddToQueue={handleAddToQueue}
            />
          )}

          {activeTab === 'recipients' && (
            <MyRecipients
              queue={queue}
              removedIds={removedIds}
              onRemoveVideo={handleRemoveRecipientVideo}
            />
          )}

          {activeTab === 'stats' && (
            <Statistics />
          )}
        </div>

        {/* ── Bottom Footer Bar ─────────────────────────────────────── */}
        <div className="footer-bar">
          {/* Left: Session Attendees */}
          <div className="footer-attendees">
            <div className="attendee-counter">
              <div className="attendee-number">1</div>
              <div className="attendee-label">
                <strong>Session Attendees</strong>
                <span>People viewing this session</span>
              </div>
            </div>
          </div>

          {/* Right: video selected + send link */}
          <div className="footer-actions">
            <div className="video-selected-info">
              <div className="video-selected-count">
                {recipientsCount} Video{recipientsCount !== 1 ? 's' : ''} in Recipients
              </div>
              <div className="video-selected-sub">
                Ready to be shared with Dawn Espinoza
              </div>
            </div>

            <button
              className="btn-send-link"
              onClick={handleSendVideoLink}
              disabled={recipientsCount === 0}
              style={{ opacity: recipientsCount === 0 ? 0.5 : 1 }}
            >
              Send Video Link
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}