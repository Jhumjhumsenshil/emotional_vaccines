'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SubMenuItem {
  name: string;
  path: string;
  roles?: string[];
}

interface NavItem {
  name: string;
  path?: string;
  roles?: string[];
  children?: SubMenuItem[];
}

export default function Sidebar({
  isOpenMobile = false,
  onCloseMobile,
}: {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
} = {}) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Track open state for submenus
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Customers', path: '/admin/customers', roles: ['Super Admin', 'Administrator'] },
    { name: 'Analytics', path: '/admin/analytics', roles: ['Super Admin', 'Administrator', 'Report Viewer'] },
    
    {
      name: 'Video Inventory',
      roles: ['Super Admin', 'Administrator'],
      children: [
        { name: 'Category', path: '/admin/categories', roles: ['Super Admin', 'Administrator'] },
        { name: 'Videos', path: '/admin/videos', roles: ['Super Admin', 'Administrator'] },
      ],
    },
    
    { name: 'Organization', path: '/admin', roles: ['Super Admin', 'Administrator'] },

    {
      name: 'Administration',
      roles: ['Super Admin', 'Administrator'],
      children: [       
        { name: 'Role Management', path: '/admin/roles', roles: ['Super Admin', 'Administrator'] },
        { name: 'User Management', path: '/admin', roles: ['Super Admin', 'Administrator'] },
      ],
    },
  ];

  // Automatically expand the submenu if current path matches any child link
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => pathname === child.path);
        if (isChildActive) {
          setOpenSubmenu(item.name);
        }
      }
    });
  }, [pathname]);

  const toggleSubmenu = (name: string) => {
    setOpenSubmenu((prev) => (prev === name ? null : name));
  };

  const isAuthorized = (roles?: string[]) => {
    if (roles && userRole && !roles.includes(userRole)) {
      return false;
    }
    return true;
  };

  const renderNavContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-bold text-[#1E3A5F]">EmotionalVaccine</h1>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <span className="sr-only">Close menu</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            if (!isAuthorized(item.roles)) return null;

            if (item.children) {
              const visibleChildren = item.children.filter((child) => isAuthorized(child.roles));
              if (visibleChildren.length === 0) return null;

              const isOpen = openSubmenu === item.name;
              const hasActiveChild = visibleChildren.some((child) => pathname === child.path);

              return (
                <li key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      hasActiveChild
                        ? 'text-[#2563EB] bg-blue-50/50'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.name}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-gray-600' : 'text-gray-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <ul className="pl-4 space-y-1">
                      {visibleChildren.map((child) => {
                        const isChildActive = pathname === child.path;
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.path}
                              onClick={onCloseMobile}
                              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                                isChildActive
                                  ? 'bg-[#EBF4FF] text-[#2563EB] font-semibold'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                              }`}
                            >
                              {child.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            if (!item.path) return null;
            const isActive = pathname === item.path;

            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-[#EBF4FF] text-[#2563EB] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col hidden md:flex shrink-0">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white border-r border-gray-200 h-full flex flex-col shadow-2xl z-50 animate-slide-in">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}