'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CreditCardIcon,
  ClockIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface SubscriptionDetails {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function SubscriptionPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch('/api/subscription/details');
      if (!response.ok) throw new Error('Failed to fetch subscription details');
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError('Failed to load subscription details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      await fetchSubscriptionDetails();
      await updateSession();
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to reactivate subscription');
      
      await fetchSubscriptionDetails();
      await updateSession();
    } catch (err) {
      setError('Failed to reactivate subscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session.user.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-dark-secondary rounded-lg p-8 text-center">
          <SparklesIcon className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Active Subscription</h1>
          <p className="text-light-secondary mb-6">
            You don't have an active premium subscription.
          </p>
          <button
            onClick={() => router.push('/premium')}
            className="bg-primary text-dark px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-dark-secondary rounded-lg p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Premium Subscription</h1>
            <p className="text-light-secondary">
              Manage your premium subscription settings
            </p>
          </div>
          <SparklesIcon className="w-8 h-8 text-primary" />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Subscription Status */}
          <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
            <CreditCardIcon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-medium">Subscription Status</h2>
              <p className="text-light-secondary">
                {subscription?.status === 'active' ? 'Active' : 'Canceling at period end'}
              </p>
            </div>
          </div>

          {/* Current Period */}
          <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
            <ClockIcon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-medium">Current Period Ends</h2>
              <p className="text-light-secondary">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Cancel/Reactivate Button */}
          {subscription?.cancelAtPeriodEnd ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="w-full bg-primary text-dark py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Reactivate Subscription
            </button>
          ) : (
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="w-full bg-red-500 text-white py-3 rounded-full font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircleIcon className="w-5 h-5" />
              Cancel Subscription
            </button>
          )}

          <p className="text-sm text-light-secondary text-center">
            {subscription?.cancelAtPeriodEnd
              ? 'Your subscription will remain active until the end of the current billing period.'
              : 'You can cancel anytime. Your subscription will remain active until the end of the billing period.'}
          </p>
        </div>
      </div>
    </div>
  );
} 