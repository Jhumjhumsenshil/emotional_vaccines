'use client';

import React, { useState, useEffect, useCallback } from 'react';
import VideoGrid from '../components/VideoGrid';

interface VideoItem {
  id: string;
  title: string;
  category?: string;
  description?: string;
  summary?: string;
  thumbnail?: string;
  duration?: string;
  languages?: string[];
  views?: number;
  featured?: boolean;
  tags?: string[];
  [key: string]: any;
}

interface SidebarFilters {
  search?: string;
  categories?: string[];
  languages?: string[];
  keywords?: string[];
}

interface SearchVideosProps {
  queue?: VideoItem[];
  onAddToQueue?: (video: VideoItem) => void;
  sidebarFilters?: SidebarFilters;
}

export default function SearchVideos({ queue = [], onAddToQueue, sidebarFilters = {} }: SearchVideosProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('recent');

  const { search = '', categories = [], languages = [], keywords = [] } = sidebarFilters;

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: '50', offset: '0' });
      if (search) params.append('search', search);
      if (languages.length === 1) params.append('language', languages[0]);
      if (categories.length === 1) params.append('category', categories[0]);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      
      // FIX 1: Append params to the fetch URL so query filters actually go through!
      const res = await fetch(`${API_BASE_URL}/videos?${params.toString()}`);
      
      if (!res.ok) throw new Error('Failed to fetch videos from database');
      
      const json = await res.json();
      
      const rawList = Array.isArray(json) ? json : (json.videos || []);

      let vids: VideoItem[] = rawList.map((v: any) => {
        const totalSecs = v.duration_seconds || 0;
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        let categoryName = v.category_name || v.category;
        if (!categoryName && v.category_id) {
          const mapIdToCategory: Record<number, string> = {
            2: 'Self Care',
            3: 'Families Thrive',
            10: 'Youth to Youth'
          };
          categoryName = mapIdToCategory[v.category_id] || 'Discovery';
        }

        // FIX 2: Standardize stream languages into uppercase codes ('EN', 'SP') 
        // to match your sidebar LANGUAGES = ['EN', 'SP'] toggles.
        const rawLangs = v.streams ? v.streams.map((s: any) => s.language) : (v.languages || ['EN']);
        const mappedLangs = rawLangs.map((l: string) => {
          const upper = l.toUpperCase();
          if (upper === 'ENGLISH' || upper === 'EN') return 'EN';
          if (upper === 'SPANISH' || upper === 'SP' || upper === 'ES') return 'SP';
          return upper;
        });

        return {
          id: String(v.id),
          title: v.default_title || v.title || '',
          description: v.default_description || v.description || '',
          thumbnail: v.default_thumbnail_url || v.thumbnail_url || (v.streams?.[0]?.thumbnail_url) || '',
          category: categoryName || 'Families Thrive',
          duration: formattedDuration,
          languages: mappedLangs,
          views: v.views || 100,
          tags: v.tags ? v.tags.map((t: any) => typeof t === 'string' ? t : t.name) : [],
        };
      });

      // Client-side search & filters
      if (search) {
        vids = vids.filter(v => v.title.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase()));
      }
      if (categories.length > 0) {        
        const categoryNameToId: Record<string, number> = {
          'Self Care': 2,
          'Families Thrive': 3,
          'Youth to Youth': 10
        };


        vids = vids.filter(v => {
          // Check if the video's category_id matches any of the selected category names' IDs
          return categories.some(catName => {
            const targetId = categoryNameToId[catName];
            return v.category_id === targetId || v.category?.toLowerCase() === catName.toLowerCase();
          });
        });
      }
      if (languages.length > 0) {
        vids = vids.filter(v => v.languages?.some(l => languages.includes(l)));
      }
      if (keywords.length > 0) {
        vids = vids.filter(v => 
          keywords.some(kw =>
            v.tags?.some((t: string) => t.toLowerCase().includes(kw.toLowerCase()))
          )
        );
      }

      setVideos(vids);
      setTotal(vids.length);
    } catch (error) {
      console.error('Error loading videos from database:', error);
      setVideos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [sort, search, categories, languages, keywords]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const addedIds = queue.map(v => v.id);

  return (
    <div>
      <div className="section-heading">
        <h2 className="section-title">Discovery Library ({total})</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="views">Sort: Most Viewed</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="featured">Sort: Featured</option>
          </select>
        </div>
      </div>

      <VideoGrid
        videos={videos}
        loading={loading}
        addedIds={addedIds}
        onAddToQueue={onAddToQueue}
      />
    </div>
  );
}