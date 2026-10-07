'use client';

import AppLayout from '../../components/layout/AppLayout';

export default function CustomersPage() {
  return (
    <AppLayout title="Customers">
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">👥</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Management</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          This module is currently under development. Soon you will be able to manage customer subscriptions, profiles, and engagement directly from here.
        </p>
      </div>
    </AppLayout>
  );
}
