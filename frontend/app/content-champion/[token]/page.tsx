import React from 'react';
import ContentChampionDashboard from '../pages/ContentChampionDashboard';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getChampionData(token: string) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${API_BASE_URL}/videos/champions/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch champion data:', error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  const champion = await getChampionData(token);

  if (!champion) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Invalid or Expired Content Champion Link</h2>
      </div>
    );
  }

  return <ContentChampionDashboard champion={champion} />;
}