'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header({
  title,
  onToggleMobileMenu,
}: {
  title?: string;
  onToggleMobileMenu?: () => void;
}) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('User');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserName(parsed.name || parsed.username);
        setUserRole(parsed.role || '');
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Open Menu"
          >
            <span className="sr-only">Open navigation menu</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {title && (
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-medium text-gray-900">{userName}</span>
          {userRole && <span className="text-xs text-gray-500">{userRole}</span>}
        </div>
        <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
