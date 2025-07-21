'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  SparklesIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isPremium = (session?.user as any)?.isPremium ?? false;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-dark-secondary border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-light-secondary" />
            <input
              type="text"
              placeholder="Search songs, artists, or playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 bg-secondary rounded-full placeholder:text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary ${
                searchQuery
                  ? 'text-primary'
                  : 'text-light'
              }`}
            />
          </div>
        </form>

        {/* User Menu */}
        <div className="relative flex items-center gap-4">
          {session ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 hover:bg-secondary p-2 rounded-full transition-colors"
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || ''}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-light-secondary" />
              )}
              <ChevronDownIcon className="h-5 w-5 text-light-secondary" />
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-light-secondary hover:text-light transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-dark px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && session && (
            <div className="absolute right-0 mt-2 w-64 bg-dark-secondary border border-gray-800 rounded-lg shadow-lg py-1 top-full">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="font-medium truncate">{session.user?.name}</p>
                <p className="text-sm text-light-secondary truncate">
                  {session.user?.email}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <SparklesIcon className={`h-4 w-4 ${isPremium ? 'text-primary' : 'text-light-secondary'}`} />
                  <span className={isPremium ? 'text-primary font-medium' : 'text-light-secondary'}>
                    {isPremium ? 'Premium Account' : 'Free Account'}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/profile');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors flex items-center gap-2"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  <span>Profile</span>
                </button>

                {/* Premium Upgrade Option - Only show for non-premium users */}
                {!isPremium && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/premium');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors flex items-center gap-2 text-primary"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span>Upgrade to Premium</span>
                  </button>
                )}

                {/* Divider */}
                <div className="h-px bg-gray-800 my-1" />

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-2 text-red-500 hover:bg-secondary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 