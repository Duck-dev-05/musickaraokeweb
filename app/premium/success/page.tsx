'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function PremiumSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          toast.error('Invalid session');
          router.push('/premium');
          return;
        }

        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify subscription');
        }

        // Update the session with new premium status
        await updateSession();
        
        // Show success toast only once
        if (!hasShownToast) {
          toast.custom((t) => (
            <div className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-dark-secondary shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 pt-0.5">
                    <SparklesIcon className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-light">
                      Welcome to Premium!
                    </p>
                    <p className="mt-1 text-sm text-light-secondary">
                      Enjoy unlimited access to all premium features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ), {
            duration: 4000,
          });
          setHasShownToast(true);
        }

        // Redirect after a short delay
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to verify subscription');
        router.push('/premium');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [searchParams, router, updateSession, hasShownToast]);

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-light-secondary">Verifying your subscription...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <SparklesIcon className="w-16 h-16 text-primary" />
        <div className="absolute inset-0 w-16 h-16 bg-primary/20 animate-ping rounded-full" />
      </div>
      <h1 className="text-3xl font-bold text-center">Welcome to Premium!</h1>
      <p className="text-light-secondary text-center max-w-md">
        Your account has been upgraded. You now have access to all premium features.
      </p>
    </div>
  );
} 