'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SearchVideos from '../pages/SearchVideos';
import MyRecipients from '../pages/MyRecipients';
import Statistics from '../pages/Statistics';
import '../styles/globals.css';
import logoImg from '../../assets/logo.png';

interface DashboardProps {
  champion: {
    id: number;
    name: string;
    email: string;
    champion_token: string;
    initials?: string;
  };
  initialDefaultVideos?: Array<{
    id: string;
    title: any;
    description: any;
    thumbnail: any;
    isDefault: any;
    category: any;
    languages: any;
  }>;
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
  isDefault?: boolean;
  [key: string]: any;
}

const LANGUAGES = ['EN', 'SP'];

export default function ContentChampionDashboard({
  champion,
  initialDefaultVideos = [],
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('videos');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Merged list of default videos + saved champion_videos
  const [defaultVideos, setDefaultVideos] = useState<VideoItem[]>(initialDefaultVideos);
  const [queue, setQueue] = useState<VideoItem[]>(initialDefaultVideos);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  // ── Sidebar filter state ──────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const toggleCategory = useCallback(
    (cat: string) =>
      setSelectedCategories((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      ),
    []
  );

  const toggleLanguage = useCallback(
    (lang: string) =>
      setSelectedLanguages((prev) =>
        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
      ),
    []
  );

  const toggleKeyword = useCallback(
    (kw: string) =>
      setSelectedKeywords((prev) =>
        prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
      ),
    []
  );

  // Track default video IDs in a Set for quick lookup
  const defaultVideoIds = useMemo(() => {
    return new Set(initialDefaultVideos.map((v) => String(v.id)));
  }, [initialDefaultVideos]);

  // Helper to fetch saved videos from champion_videos table and merge with defaults
  const fetchSavedChampionVideos = useCallback(async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const identifier = champion.id;

      const res = await fetch(`${API_BASE_URL}/videos/champions/${identifier}/videos`);
      if (res.ok) {
        const savedVideos: VideoItem[] = await res.json();

        const videoMap = new Map<string, VideoItem>();

        // 1. Add initial default videos first
        initialDefaultVideos.forEach((video) => {
          videoMap.set(String(video.id), video);
        });

        // 2. Add/overwrite with customer's saved videos from champion_videos
        savedVideos.forEach((video) => {
          videoMap.set(String(video.id), video);
        });

        // 3. Filter out any videos removed during this session
        const mergedList = Array.from(videoMap.values()).filter(
          (video) => !removedIds.includes(String(video.id))
        );

        setDefaultVideos(mergedList);
        setQueue(mergedList);
      }
    } catch (error) {
      console.error('Failed to fetch saved champion videos:', error);
    }
  }, [champion.id, initialDefaultVideos, removedIds]);

  // 1. Load saved videos on initial mount
  useEffect(() => {
    fetchSavedChampionVideos();
  }, [fetchSavedChampionVideos]);

  // 2. Add video to recipient list (restricting default videos from being saved to champion_videos)
  const handleAddToQueue = useCallback(
    async (video: VideoItem) => {
      const videoIdStr = String(video.id);
      const isDefaultVideo = defaultVideoIds.has(videoIdStr) || Boolean(video.isDefault);

      // If it's a default video:
      if (isDefaultVideo) {
        // If it was previously removed in this session, restore it locally without hitting DB
        if (removedIds.includes(videoIdStr)) {
          setRemovedIds((prev) => prev.filter((id) => id !== videoIdStr));
          setDefaultVideos((prev) =>
            prev.some((v) => String(v.id) === videoIdStr) ? prev : [...prev, video]
          );
          setQueue((prev) =>
            prev.some((v) => String(v.id) === videoIdStr) ? prev : [...prev, video]
          );
        }
        // Otherwise do nothing—already in default list, do not save to champion_videos or increment count
        return;
      }

      // Prevent duplicate additions if already in the active list
      if (defaultVideos.some((v) => String(v.id) === videoIdStr)) {
        return;
      }

      // Optimistic UI update for custom video
      setRemovedIds((prev) => prev.filter((id) => id !== videoIdStr));
      setDefaultVideos((prev) => [...prev, video]);
      setQueue((prev) => [...prev, video]);

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const identifier = champion.id;

        const response = await fetch(`${API_BASE_URL}/videos/champions/${identifier}/videos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: Number(video.id),
            rating: video.rating || 0.0,
            selected_language: video.languages?.[0] || 'EN',
          }),
        });

        if (response.ok) {
          // Re-fetch from champion_videos table so state & count stay synced with DB
          await fetchSavedChampionVideos();
        }
      } catch (error) {
        console.error('Failed to save video selection to backend:', error);
      }
    },
    [champion.id, defaultVideoIds, defaultVideos, removedIds, fetchSavedChampionVideos]
  );

  // 3. Remove video from recipient list & delete from champion_videos if non-default
  const handleRemoveRecipientVideo = useCallback(
    async (id: string) => {
      const videoIdStr = String(id);

      // Optimistically update local UI state immediately
      setRemovedIds((prev) => (prev.includes(videoIdStr) ? prev : [...prev, videoIdStr]));
      setQueue((prev) => prev.filter((v) => String(v.id) !== videoIdStr));
      setDefaultVideos((prev) => prev.filter((v) => String(v.id) !== videoIdStr));

      // Skip backend DELETE if it's purely a default video
      if (defaultVideoIds.has(videoIdStr)) {
        return;
      }

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const identifier = champion.id;

        const response = await fetch(
          `${API_BASE_URL}/videos/champions/${identifier}/videos/${videoIdStr}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          await fetchSavedChampionVideos();
        }
      } catch (error) {
        console.error('Failed to remove video from backend:', error);
      }
    },
    [champion.id, defaultVideoIds, fetchSavedChampionVideos]
  );

  // Automatically reflects the exact number of active videos in the recipient list
  const recipientsCount = useMemo(() => {
    return defaultVideos.filter((v) => !removedIds.includes(String(v.id))).length;
  }, [defaultVideos, removedIds]);

  const handleSendVideoLink = () => {
    if (recipientsCount === 0) return;
    alert(`Sharing ${recipientsCount} video(s) with recipients!`);
  };

  const sidebarFilters = useMemo(
    () => ({
      search: searchTerm,
      categories: selectedCategories,
      languages: selectedLanguages,
      keywords: selectedKeywords,
    }),
    [searchTerm, selectedCategories, selectedLanguages, selectedKeywords]
  );

  return (

    
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
  {/* 1. Header spans the full width at the top */}
  <Header
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    queueCount={recipientsCount}
    onMenuClick={() => setSidebarOpen((o) => !o)}
    champion={champion}
    logoImg={typeof logoImg === 'string' ? logoImg : logoImg.src}
  />

  {/* 2. Lower container holding sidebar and main content side-by-side */}
  <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
    {/* Sidebar appears under the header, exclusively on the Search Videos tab */}
    {activeTab === 'videos' && (
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
      />
    )}

    {/* Main content and footer area */}
    <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            queue={defaultVideos}
            removedIds={removedIds}
            onRemoveVideo={handleRemoveRecipientVideo}
            onRefreshVideos={fetchSavedChampionVideos}
            
          />
        )}

        {activeTab === 'stats' && <Statistics />}
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
</div>
  );
}