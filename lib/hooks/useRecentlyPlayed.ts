import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Song } from '@/lib/stores/playerStore';

interface RecentlyPlayedSong extends Song {
  playedAt: string;
}

export function useRecentlyPlayed() {
  const { data: session } = useSession();
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // All old direct API call code for recently played songs has been deleted.

  // Add song to recently played
  const addToRecentlyPlayed = async (songId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/songs/recently-played', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId }),
      });

      if (!response.ok) throw new Error('Failed to update recently played');
      
      // Refresh the recently played list
      const updatedResponse = await fetch('/api/songs/recently-played');
      if (!updatedResponse.ok) throw new Error('Failed to fetch updated recently played songs');
      
      const data = await updatedResponse.json();
      const formattedSongs = data.map((item: any) => ({
        id: item.song.id,
        title: item.song.title,
        artist: item.song.artist,
        duration: item.song.duration,
        source: item.song.source,
        sourceUrl: item.song.sourceUrl,
        thumbnail: item.song.thumbnail,
        playedAt: item.playedAt,
      }));
      
      setRecentlyPlayed(formattedSongs);
    } catch (error) {
      console.error('Error updating recently played:', error);
    }
  };

  const formatPlayedAt = (playedAt: string) => {
    const date = new Date(playedAt);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return {
    recentlyPlayed,
    isLoading,
    addToRecentlyPlayed,
    formatPlayedAt,
  };
} 