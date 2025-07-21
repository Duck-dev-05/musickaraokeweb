'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { PlayIcon, PauseIcon, PencilIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { Song } from '@/lib/stores/playerStore';

interface PlaylistSong extends Song {
  position: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  userId: string;
  songs: PlaylistSong[];
}

export default function PlaylistDetailsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const { currentSong, isPlaying, setCurrentSong, setQueue, setIsPlaying } = usePlayerStore();

  const fetchPlaylist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/playlists/${params.playlistId}`);
      if (!response.ok) throw new Error('Failed to fetch playlist');
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      toast.error('Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.playlistId) {
      fetchPlaylist();
    }
  }, [params.playlistId]);

  const handlePlayPause = (song?: PlaylistSong) => {
    if (!playlist) return;

    if (song) {
      // Play specific song
      setCurrentSong(song);
      // Add remaining songs to queue
      const remainingSongs = playlist.songs
        .filter(s => s.position > song.position)
        .sort((a, b) => a.position - b.position);
      setQueue(remainingSongs);
    } else {
      // Play/pause current song or start playlist from beginning
      if (currentSong && playlist.songs.some(s => s.id === currentSong.id)) {
        setIsPlaying(!isPlaying);
      } else {
        const [firstSong, ...restSongs] = playlist.songs.sort((a, b) => a.position - b.position);
        if (firstSong) {
          setCurrentSong(firstSong);
          setQueue(restSongs);
        }
      }
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!playlist || !editedName.trim()) return;

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          description: playlist.description,
          thumbnail: playlist.thumbnail,
        }),
      });

      if (!response.ok) throw new Error('Failed to update playlist');

      const updatedPlaylist = await response.json();
      setPlaylist(updatedPlaylist);
      setIsEditing(false);
      toast.success('Playlist name updated');
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast.error('Failed to update playlist name');
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!playlist || !session?.user) return;

    try {
      const response = await fetch(`/api/playlists/${playlist.id}/songs/${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove song');

      // Update local state
      setPlaylist(prev => {
        if (!prev) return null;
        return {
          ...prev,
          songs: prev.songs.filter(song => song.id !== songId),
        };
      });

      toast.success('Song removed from playlist');
    } catch (error) {
      console.error('Error removing song:', error);
      toast.error('Failed to remove song');
    }
  };

  const startEditing = () => {
    if (playlist) {
      setEditedName(playlist.name);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-light-secondary">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Playlist Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="relative w-48 h-48 bg-dark-secondary rounded-lg overflow-hidden flex-shrink-0">
          {playlist.thumbnail ? (
            <Image
              src={playlist.thumbnail}
              alt={playlist.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark">
              <PlayIcon className="w-16 h-16 text-light-secondary" />
            </div>
          )}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-3xl font-bold bg-dark-secondary rounded px-2 py-1 w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdatePlaylist();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <button
                onClick={handleUpdatePlaylist}
                className="px-4 py-2 bg-primary text-dark rounded hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-dark-secondary text-light rounded hover:bg-dark-secondary/90 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{playlist.name}</h1>
              <button
                onClick={startEditing}
                className="p-1 text-light-secondary hover:text-light transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          {playlist.description && (
            <p className="text-light-secondary mb-4">{playlist.description}</p>
          )}
          <button
            onClick={() => handlePlayPause()}
            className="px-6 py-2 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors"
          >
            {isPlaying && currentSong && playlist.songs.some(s => s.id === currentSong.id) ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-2">
        {playlist.songs.length === 0 ? (
          <p className="text-light-secondary text-center py-8">No songs in this playlist</p>
        ) : (
          playlist.songs
            .sort((a, b) => a.position - b.position)
            .map((song) => (
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
                    <div className="w-full h-full bg-dark rounded flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-light-secondary" />
                    </div>
                  )}
                  <button
                    onClick={() => handlePlayPause(song)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isPlaying && currentSong?.id === song.id ? (
                      <PauseIcon className="w-6 h-6 text-white" />
                    ) : (
                      <PlayIcon className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{song.title}</h3>
                  <p className="text-sm text-light-secondary truncate">{song.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveSong(song.id)}
                    className="text-xs text-light-secondary hover:text-light transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
} 