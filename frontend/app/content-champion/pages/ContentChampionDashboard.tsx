'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SearchVideos from '../pages/SearchVideos';
import MyRecipients from '../pages/MyRecipients';
import Statistics from '../pages/Statistics';
import { FALLBACK_RECIPIENT_VIDEOS, FALLBACK_RECIPIENT_IDS } from '../data/recipientVideos';
import '../styles/globals.css';
import logoImg from '../../assets/logo.png';

interface Champion {
  id: number;
  name: string;
  email: string;
  champion_token: string;
  initials?: string;
}

interface DashboardProps {
  champion: Champion;
}

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

export default function ContentChampionDashboard({ champion }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('videos');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // ── Sidebar filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

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

  // ── Video Queue ──────────────────────────────────────────────────
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

  const handleSendVideoLink = () => {
    if (recipientsCount === 0) return;
    alert(`Sharing ${recipientsCount} video(s) with recipients!`);
  };

  const sidebarFilters = useMemo(() => ({
    search: searchTerm,
    categories: selectedCategories,
    languages: selectedLanguages,
    keywords: selectedKeywords,
  }), [searchTerm, selectedCategories, selectedLanguages, selectedKeywords]);

  const championInitials = champion.initials || (champion.name ? champion.name.slice(0, 2).toUpperCase() : 'DE');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
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
        onClose={() => setSidebarOpen(false)}
        logoImg={typeof logoImg === 'string' ? logoImg : logoImg.src}
      />

      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          queueCount={recipientsCount}
          onMenuClick={() => setSidebarOpen(o => !o)}
          champion={champion} // Pass dynamic champion data to header if needed
        />

        <div className="page-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
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

        <div className="footer-bar">
          <div className="footer-attendees">
            <div className="attendee-counter">
              <div className="attendee-number">1</div>
              <div className="attendee-label">
                <strong>Session Attendees</strong>
                <span>People viewing this session</span>
              </div>
            </div>
          </div>

          <div className="footer-actions">
            <div className="video-selected-info">
              <div className="video-selected-count">
                {recipientsCount} Video{recipientsCount !== 1 ? 's' : ''} in Recipients
              </div>
              <div className="video-selected-sub">
                Ready to be shared with {champion.name}
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