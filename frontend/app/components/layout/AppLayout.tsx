'use client';

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F8FAFB] overflow-hidden">
      <Sidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          title={title}
          onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-3.5 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}