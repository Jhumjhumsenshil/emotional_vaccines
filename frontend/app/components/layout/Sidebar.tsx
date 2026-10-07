'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

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

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Customers', path: '/admin/customers', roles: ['Super Admin', 'Administrator'] },
    { name: 'Analytics', path: '/admin/analytics', roles: ['Super Admin', 'Administrator', 'Report Viewer'] },
    { name: 'User Management', path: '/admin', roles: ['Super Admin', 'Administrator'] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-xl font-bold text-[#1E3A5F]">EmotionalVaccine</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            // Check role authorization if roles are specified
            if (item.roles && userRole && !item.roles.includes(userRole)) {
              return null;
            }
            const isActive = pathname === item.path;

            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${isActive
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
    </aside>
  );
}
