'use client';

import { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface LikedSong {
  id: string;
  likedAt: string;
  song: {
    id: string;
    title: string;
    artist: string;
    duration: string;
    source: string;
    sourceUrl: string;
    thumbnail: string;
  };
}

export default function LikedSongsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const { setCurrentSong, isPlaying, setIsPlaying, currentSong } = usePlayerStore();
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const response = await fetch('/api/songs/liked');
        if (!response.ok) throw new Error('Failed to fetch liked songs');
        const data = await response.json();
        setLikedSongs(data);
      } catch (error) {
        console.error('Error fetching liked songs:', error);
        toast.error('Failed to load liked songs');
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchLikedSongs();
    }
  }, [session?.user]);

  const handlePlay = (likedSong: LikedSong) => {
    if (currentSong?.id === likedSong.song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong({
        id: likedSong.song.id,
        title: likedSong.song.title,
        artist: likedSong.song.artist,
        duration: likedSong.song.duration,
        source: likedSong.song.source as any,
        sourceUrl: likedSong.song.sourceUrl,
        thumbnail: likedSong.song.thumbnail,
      });
      setIsPlaying(true);
    }
    setCurrentlyPlaying(likedSong.song.id);
  };

  const handleUnlike = async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/liked?songId=${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to unlike song');

      // Remove song from list
      setLikedSongs(prev => prev.filter(item => item.song.id !== songId));
      toast.success('Removed from liked songs');
    } catch (error) {
      console.error('Error unliking song:', error);
      toast.error('Failed to remove from liked songs');
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Sign in to view your liked songs</h2>
        <button
          onClick={() => router.push('/login')}
          className="bg-primary text-dark px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative h-[40vh] bg-gradient-to-b from-primary/20 to-dark rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-end p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HeartSolid className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">PLAYLIST</span>
            </div>
            <h1 className="text-7xl font-bold">Liked Songs</h1>
            <div className="flex items-center gap-2 text-light-secondary">
              <span className="text-light font-medium">{session.user.name}</span>
              <span>•</span>
              <span>{likedSongs.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => likedSongs.length > 0 && handlePlay(likedSongs[0])}
          className="h-14 w-14 flex items-center justify-center bg-primary rounded-full hover:scale-105 transition-transform"
          disabled={likedSongs.length === 0}
        >
          {isPlaying && currentSong && likedSongs.some(ls => ls.song.id === currentSong.id) ? (
            <PauseIcon className="h-7 w-7 text-dark" />
          ) : (
            <PlayIcon className="h-7 w-7 text-dark" />
          )}
        </button>
      </div>

      {/* Songs List */}
      <div className="bg-dark-secondary/50 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="grid grid-cols-12 gap-4 text-light-secondary text-sm font-medium">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">TITLE</div>
            <div className="col-span-3">ARTIST</div>
            <div className="col-span-2">DATE ADDED</div>
            <div className="col-span-1 text-right">DURATION</div>
          </div>
        </div>
        <div className="divide-y divide-gray-800">
          {likedSongs.map((likedSong, index) => (
            <div
              key={likedSong.id}
              className="px-6 py-3 grid grid-cols-12 gap-4 items-center hover:bg-secondary/50 group"
              onMouseEnter={() => setHoveredSong(likedSong.song.id)}
              onMouseLeave={() => setHoveredSong(null)}
            >
              <div className="col-span-1 text-center">
                {hoveredSong === likedSong.song.id ? (
                  <button
                    onClick={() => handlePlay(likedSong)}
                    className="text-light"
                  >
                    {currentlyPlaying === likedSong.song.id && isPlaying ? (
                      <PauseIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>
                ) : (
                  <span className={`text-light-secondary ${currentlyPlaying === likedSong.song.id ? 'text-primary' : ''}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="col-span-5 flex items-center gap-4">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={likedSong.song.thumbnail}
                    alt={likedSong.song.title}
                    fill
                    sizes="40px"
                    className="rounded object-cover"
                  />
                </div>
                <div>
                  <h3 className={`font-medium ${currentlyPlaying === likedSong.song.id ? 'text-primary' : ''}`}>
                    {likedSong.song.title}
                  </h3>
                  <p className="text-sm text-light-secondary">{likedSong.song.artist}</p>
                </div>
              </div>
              <div className="col-span-3 text-light-secondary">{likedSong.song.artist}</div>
              <div className="col-span-2 text-light-secondary">
                {new Date(likedSong.likedAt).toLocaleDateString()}
              </div>
              <div className="col-span-1 flex items-center justify-end gap-4">
                <button 
                  onClick={() => handleUnlike(likedSong.song.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                    hoveredSong === likedSong.song.id ? 'text-primary' : 'text-light-secondary hover:text-primary'
                  }`}
                >
                  <HeartSolid className="h-5 w-5" />
                </button>
                <span className="text-light-secondary">{likedSong.song.duration}</span>
              </div>
            </div>
          ))}

          {likedSongs.length === 0 && (
            <div className="px-6 py-8 text-center text-light-secondary">
              No liked songs yet. Start liking some songs!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 