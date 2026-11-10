import { useState, useEffect, useCallback } from 'react';

// Fallback data in case the backend server is temporarily unreachable
const FALLBACK_VIDEOS = [
  {
    id: "vid-1",
    title: "Next.js 15 & React 19 Full-Stack Architecture Masterclass",
    channel: "CodeCraft Studios",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    platform: "YouTube",
    category: "Tech",
    duration: "24:18",
    views: 342000,
    likes: 21800,
    shares: 4320,
    publishedAt: "2026-08-28T14:30:00Z",
    tags: ["React 19", "Next.js", "WebDev", "FullStack"],
    summary: "Comprehensive guide to server actions, streaming, and production deployment patterns in 2026.",
    recipientCount: 4
  },
  {
    id: "vid-2",
    title: "Minimalist UI/UX Principles That 10x Product Conversion",
    channel: "Elena Visuals",
    creatorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
    platform: "YouTube",
    category: "Design",
    duration: "18:45",
    views: 189400,
    likes: 14200,
    shares: 2890,
    publishedAt: "2026-09-02T10:15:00Z",
    tags: ["UIUX", "Figma", "DesignSystem", "Conversion"],
    summary: "Visual hierarchy, spatial cadence, and typography contrast techniques used by top SaaS apps.",
    recipientCount: 6
  },
  {
    id: "vid-3",
    title: "Top 7 Agentic AI Workflows Revolutionizing Marketing Teams",
    channel: "Growth Velocity",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    platform: "TikTok",
    category: "AI",
    duration: "03:12",
    views: 890000,
    likes: 76500,
    shares: 19800,
    publishedAt: "2026-09-08T18:00:00Z",
    tags: ["AI", "Automation", "Marketing", "Productivity"],
    summary: "Bite-sized breakdown of multi-agent LLM systems streamlining content pipelines.",
    recipientCount: 9
  },
  {
    id: "vid-4",
    title: "Cinematic Lighting on a Budget: 3-Point Studio Setup",
    channel: "Apex Cinema",
    creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80",
    platform: "Vimeo",
    category: "Lifestyle",
    duration: "15:20",
    views: 95400,
    likes: 8300,
    shares: 1420,
    publishedAt: "2026-08-15T09:00:00Z",
    tags: ["Cinematography", "Lighting", "Filmmaking", "Studio"],
    summary: "How to craft professional Hollywood-grade lighting with accessible gear.",
    recipientCount: 3
  }
];

export function useFetchVideos(filters = {}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.platform && filters.platform !== 'All') params.append('platform', filters.platform);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await fetch(`/api/videos?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const json = await res.json();
      setVideos(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.warn('Backend unavailable, using fallback dummy data:', err.message);
      // Filter the fallback mock data locally
      let filtered = [...FALLBACK_VIDEOS];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q));
      }
      if (filters.category && filters.category !== 'All') {
        filtered = filtered.filter(v => v.category.toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.platform && filters.platform !== 'All') {
        filtered = filtered.filter(v => v.platform.toLowerCase() === filters.platform.toLowerCase());
      }
      setVideos(filtered);
      setTotal(filtered.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.category, filters.platform, filters.sort]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, total, refetch: fetchVideos };
}

export default useFetchVideos;
