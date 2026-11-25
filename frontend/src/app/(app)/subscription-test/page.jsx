'use client';

import { useEffect, useState } from 'react';

import subscriptionApi from '@/lib/subscription-api';

export default function SubscriptionTestPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function test() {
      try {
        const data =
          await subscriptionApi.refreshBillingDetails();

        setResult(data);
      } catch (err) {
        setError(err.message);
      }
    }

    test();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Subscription API Test
      </h1>

      {error && (
        <pre className="mt-4 text-red-600">
          {error}
        </pre>
      )}

      {result && (
        <pre className="mt-4 overflow-auto rounded-xl bg-gray-100 p-4 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {!result && !error && (
        <p className="mt-4">Testing API...</p>
      )}
    </main>
  );
}