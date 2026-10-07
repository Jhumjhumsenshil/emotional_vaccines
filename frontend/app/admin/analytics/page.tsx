'use client';

import AppLayout from '../../components/layout/AppLayout';

export default function AnalyticsPage() {
  return (
    <AppLayout title="Analytics & Reports">
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">📈</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Advanced analytics and reporting tools are coming soon. You'll be able to track user engagement, retention, and video performance metrics.
        </p>
      </div>
    </AppLayout>
  );
}
