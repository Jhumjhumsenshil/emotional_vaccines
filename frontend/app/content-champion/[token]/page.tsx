import React from 'react';
import ContentChampionDashboard from '../pages/ContentChampionDashboard';

interface PageProps {
  params: Promise<{ token: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function getChampionData(token: string) {
  
  try {
    const res = await fetch(`${API_BASE_URL}/videos/champions/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch champion data:', error);
    return null;
  }
}

async function getDefaultVideos() {
  try {
    const res = await fetch(`${API_BASE_URL}/videos/default_video`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data
        .filter((v: any) => v.is_default)
        .map((v: any) => ({
          id: String(v.id),
          title: v.default_title,
          description: v.default_description,
          thumbnail: v.default_thumbnail_url,
          isDefault: v.is_default,
          category: v.categories?.[0]?.name || 'General',
          languages: v.streams?.map((s: any) => s.language) || ['EN'],
          streams: v.streams || [],
        }));
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch default videos:', error);
    return [];
  }
}

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  const [champion, defaultVideos] = await Promise.all([
    getChampionData(token),
    getDefaultVideos()
  ]);

  if (!champion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Invalid or Expired Content Champion Link</h2>
      </div>
    );
  }

  return <ContentChampionDashboard champion={champion} initialDefaultVideos={defaultVideos}/>;
}