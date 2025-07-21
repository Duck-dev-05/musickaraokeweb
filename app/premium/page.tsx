'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  MusicalNoteIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const features = [
  {
    icon: CloudArrowUpIcon,
    title: 'Unlimited Song Uploads',
    description: 'Upload as many songs as you want to your library',
  },
  {
    icon: MusicalNoteIcon,
    title: 'High Quality Audio',
    description: 'Stream your music in the highest quality available',
  },
  {
    icon: SparklesIcon,
    title: 'Premium Features',
    description: 'Access to exclusive features and early updates',
  },
];

export default function PremiumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!session) {
        router.push('/login');
        return;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // Redirect to Stripe checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error upgrading to premium:', err);
      setError('Failed to process upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-light-secondary text-lg">
          Unlock unlimited uploads and premium features
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-dark-secondary rounded-lg p-6 text-center"
          >
            <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-light-secondary">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-dark-secondary rounded-lg p-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Premium Plan</h2>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold">$9.99</span>
            <span className="text-light-secondary">/month</span>
          </div>
        </div>

        {/* Feature List */}
        <ul className="space-y-4 mb-8">
          <li className="flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <span>Unlimited song uploads</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <span>High quality audio streaming</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <span>Ad-free experience</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <span>Priority support</span>
          </li>
        </ul>

        {/* Upgrade Button */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full bg-primary text-dark py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            'Upgrade Now'
          )}
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-light-secondary text-sm text-center mt-4">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
} 