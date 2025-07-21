'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import PlaylistTable from '@/components/PlaylistTable';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  _count: {
    songs: number;
  };
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isPremium = (session?.user as any)?.isPremium ?? false;

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists');
        if (!response.ok) throw new Error('Failed to fetch playlists');
        const data = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        toast.error('Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Playlist',
          description: 'My new playlist',
        }),
      });

      if (!response.ok) throw new Error('Failed to create playlist');
      
      const newPlaylist = await response.json();
      setPlaylists(prev => [newPlaylist, ...prev]);
      toast.success('Playlist created');
      router.push(`/playlists/${newPlaylist.id}`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <button
          onClick={handleCreatePlaylist}
          className="px-6 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
        >
          Create Playlist
        </button>
      </div>

      {/* Premium Upgrade Card - Only show for non-premium users */}
      {!isPremium && (
        <div className="bg-dark-secondary rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <SparklesIcon className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold mb-2">Upgrade to Premium</h2>
              <p className="text-light-secondary mb-4">
                Create unlimited playlists and enjoy premium features
              </p>
              <button
                onClick={() => router.push('/premium')}
                className="px-6 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlists */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {playlists.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-light-secondary mb-4">No playlists yet</p>
              <button
                onClick={handleCreatePlaylist}
                className="text-primary hover:underline"
              >
                Create your first playlist
              </button>
            </div>
          ) : (
            <PlaylistTable playlists={playlists} />
          )}
        </div>
      )}
    </div>
  );
} 