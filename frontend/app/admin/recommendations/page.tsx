'use client';

import AppLayout from '../../components/layout/AppLayout';

export default function RecommendationsPage() {
  return (
    <AppLayout title="Recommendations Engine">
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Recommendations</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          The machine learning recommendation engine interface is being prepared. Here you will be able to tune algorithms for personalized video suggestions.
        </p>
      </div>
    </AppLayout>
  );
}
