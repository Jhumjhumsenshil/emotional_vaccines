'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string>('Connecting to FastAPI...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus('Backend disconnected'));
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white font-sans">
      <h1 className="text-3xl font-bold mb-4">Video Portal</h1>
      <p className="text-lg text-gray-300">
        Backend Status: <span className="font-semibold text-emerald-400">{status}</span>
      </p>
    </main>
  );
}