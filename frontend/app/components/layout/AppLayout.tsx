'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8FAFB] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div
            className="w-full max-w-[1400px] mx-auto px-4 py-4 sm:px-5 sm:py-5"
            style={{ paddingLeft: 4, paddingRight: 4, marginLeft: 'auto', marginRight: 'auto' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}