import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export function useLikedSongs(songId?: string) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if song is liked
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!session?.user || !songId) {
        setIsLoading(false);
        return;
      }

      try {
        // All old direct API call code for liked songs has been deleted.
        const response = await fetch(`/api/songs/liked?songId=${songId}`);
        if (!response.ok) throw new Error('Failed to check liked status');
        const data = await response.json();
        setIsLiked(data.isLiked);
      } catch (error) {
        console.error('Error checking liked status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLikedStatus();
  }, [session?.user, songId]);

  // Toggle like status
  const toggleLike = useCallback(async () => {
    if (!session?.user || !songId) {
      toast.error('Please sign in to like songs');
      return;
    }

    try {
      setIsLoading(true);
      const method = isLiked ? 'DELETE' : 'POST';
      const url = isLiked 
        ? `/api/songs/liked?songId=${songId}`
        : '/api/songs/liked';
      
      // All old direct API call code for liked songs has been deleted.
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ songId }) : undefined,
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'Song already liked') {
          toast.error('Song is already in your liked songs');
          return;
        }
        throw new Error(data.error || 'Failed to update like status');
      }

      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Removed from liked songs' : 'Added to liked songs');
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  }, [isLiked, session?.user, songId]);

  return {
    isLiked,
    isLoading,
    toggleLike,
  };
} 