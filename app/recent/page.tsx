'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MusicalNoteIcon, 
  PlayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: string;
  thumbnail: string | null;
  source: string;
  playedAt: string;
}

export default function RecentlyPlayedPage() {
  const { data: session, status } = useSession();
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentSongs = async () => {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/songs/recently-played');
        if (!response.ok) {
          throw new Error('Failed to fetch recently played songs');
        }
        
        const data = await response.json();
        setRecentSongs(data);
      } catch (error) {
        console.error('Error fetching recent songs:', error);
        setError('Failed to load recently played songs');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchRecentSongs();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Sign in to view your history</h1>
        <p className="text-light-secondary">See your recently played songs</p>
        <Link 
          href="/login"
          className="px-4 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="text-light-secondary">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClockIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Recently Played</h1>
      </div>

      {recentSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-light-secondary">No recently played songs</p>
          <Link
            href="/songs"
            className="px-4 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
          >
            Discover Songs
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recentSongs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors group"
            >
              <div className="relative w-12 h-12 flex-shrink-0">
                {song.thumbnail ? (
                  <Image
                    src={song.thumbnail}
                    alt={song.title}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark rounded">
                    <MusicalNoteIcon className="w-6 h-6 text-light-secondary" />
                  </div>
                )}
                <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                  <PlayIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{song.title}</h3>
                <p className="text-sm text-light-secondary truncate">
                  {song.artist}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary">
                    {song.source}
                  </span>
                </p>
              </div>
              <div className="text-sm text-light-secondary">
                {new Date(song.playedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 