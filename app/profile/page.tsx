'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  UserCircleIcon,
  SparklesIcon,
  MusicalNoteIcon,
  HeartIcon,
  ClockIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      icon: MusicalNoteIcon,
      label: 'Uploaded Songs',
      value: '0',
    },
    {
      icon: HeartIcon,
      label: 'Liked Songs',
      value: '0',
    },
    {
      icon: ClockIcon,
      label: 'Recently Played',
      value: '0',
    },
  ];

  const isPremium = session.user.isPremium ?? false;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Profile Header */}
      <div className="bg-dark-secondary rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary flex-shrink-0">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                fill
                className="object-cover"
              />
            ) : (
              <UserCircleIcon className="w-full h-full text-light-secondary p-4" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{session.user.name}</h1>
              {isPremium ? (
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <SparklesIcon className="h-4 w-4" />
                  Premium
                </span>
              ) : (
                <button
                  onClick={() => router.push('/premium')}
                  className="bg-primary text-dark px-4 py-1 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Upgrade to Premium
                </button>
              )}
            </div>
            <p className="text-light-secondary mb-4">{session.user.email}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-secondary/20 p-4 rounded-lg flex items-center gap-3"
                >
                  <stat.icon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-light-secondary">{stat.label}</div>
                    <div className="font-medium">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-dark-secondary rounded-lg divide-y divide-gray-800">
        <div className="p-6">
          <h3 className="font-medium mb-1">Email Notifications</h3>
          <p className="text-sm text-light-secondary mb-3">
            Manage your email notification preferences
          </p>
          <button className="text-primary hover:underline">
            Manage Notifications
          </button>
        </div>

        <div className="p-6">
          <h3 className="font-medium mb-1">Account Security</h3>
          <p className="text-sm text-light-secondary mb-3">
            Update your password and security settings
          </p>
          <button className="text-primary hover:underline">
            Security Settings
          </button>
        </div>

        {/* Premium Subscription Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-medium">Premium Subscription</h3>
            {isPremium && (
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-light-secondary mb-3">
            {isPremium
              ? 'Manage your premium subscription settings'
              : 'Upgrade to premium for unlimited access'}
          </p>
          <button
            onClick={() => router.push(isPremium ? '/subscription' : '/premium')}
            className="text-primary hover:underline flex items-center gap-2"
          >
            <CreditCardIcon className="w-4 h-4" />
            {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
          </button>
        </div>
      </div>
    </div>
  );
} 