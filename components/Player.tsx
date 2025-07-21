'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/lib/stores/playerStore';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import ReactPlayer from 'react-player';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import LikeButton from './LikeButton';
import { useRecentlyPlayed } from '@/lib/hooks/useRecentlyPlayed';
import AddToPlaylistDropdown from './AddToPlaylistDropdown';

// Helper function to get YouTube video ID
const getYouTubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper function to save song to database
const saveSongToDatabase = async (song: any) => {
  try {
    // If it's a YouTube song and doesn't have a thumbnail, try to get it from the API
    let thumbnail = song.thumbnail;
    if (song.source === 'youtube' && !thumbnail) {
      const videoId = getYouTubeVideoId(song.sourceUrl);
      if (videoId) {
        try {
          const response = await fetch(`/api/youtube/video/${videoId}`);
          if (response.ok) {
            const data = await response.json();
            thumbnail = data.thumbnail;
          }
        } catch (error) {
          console.error('Error fetching YouTube thumbnail:', error);
        }
      }
    }

    const response = await fetch('/api/songs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        source: song.source,
        sourceUrl: song.sourceUrl,
        thumbnail: thumbnail,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save song');
    }

    const savedSong = await response.json();
    return savedSong;
  } catch (error) {
    console.error('Error saving song:', error);
    return null;
  }
};

export default function Player() {
  const { data: session } = useSession();
  const { addToRecentlyPlayed } = useRecentlyPlayed();
  const {
    currentSong,
    isPlaying,
    volume,
    isShuffled,
    queue,
    hasStartedPlaying,
    setIsPlaying,
    setVolume,
    playNext,
    playPrevious,
    toggleShuffle,
    setHasStartedPlaying,
  } = usePlayerStore();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const lastClickTime = useRef<number>(0);
  const MIN_CLICK_INTERVAL = 300; // milliseconds
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isAddingToPlaylist, setIsAddingToPlaylist] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user playlists when dropdown is opened
  useEffect(() => {
    if (showPlaylistDropdown && session?.user) {
      fetch('/api/playlists')
        .then(res => res.json())
        .then(data => setUserPlaylists(data.playlists || []));
    }
  }, [showPlaylistDropdown, session]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPlaylistDropdown(false);
      }
    }
    if (showPlaylistDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlaylistDropdown]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!currentSong) return;
    setIsAddingToPlaylist(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: currentSong.id }),
      });
      if (!res.ok) throw new Error('Failed to add to playlist');
      toast.success('Added to playlist!');
      setShowPlaylistDropdown(false);
    } catch (err) {
      toast.error('Failed to add to playlist');
    } finally {
      setIsAddingToPlaylist(false);
    }
  };

  useEffect(() => {
    // Reset states when song changes
    setProgress(0);
    setDuration(0);
    setError(null);
    setIsLoading(true);
    setHasStartedPlaying(false);
    
    // Auto-play when song changes
    if (currentSong) {
      setIsPlaying(true);
    }
  }, [currentSong, setIsPlaying, setHasStartedPlaying]);

  // Auto-play next song when current song ends
  useEffect(() => {
    const handleSongEnd = () => {
      if (queue.length > 0) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };

    if (currentSong?.source === 'local' && audioRef.current) {
      audioRef.current.addEventListener('ended', handleSongEnd);
      return () => audioRef.current?.removeEventListener('ended', handleSongEnd);
    }
  }, [currentSong, queue, playNext, setIsPlaying]);

  // Button click states
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [isPrevLoading, setIsPrevLoading] = useState(false);
  const [isShuffleLoading, setIsShuffleLoading] = useState(false);
  const lastTrackedSongId = useRef<string | null>(null);
  const trackPlayTimeout = useRef<NodeJS.Timeout | null>(null);

  // Optimized handlers with debounce and loading states
  const handlePlayPause = useCallback(() => {
    if (!currentSong) return;
    
    const now = Date.now();
    if (now - lastClickTime.current < MIN_CLICK_INTERVAL) return;
    lastClickTime.current = now;

    if (error) {
      setError(null);
      setIsLoading(true);
      
      if (currentSong.source === 'local' && audioRef.current) {
        audioRef.current.load();
      }
    }
    setIsPlaying(!isPlaying);
  }, [currentSong, error, isPlaying, setIsPlaying]);

  const handleNext = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTime.current < MIN_CLICK_INTERVAL) return;
    lastClickTime.current = now;

    setIsNextLoading(true);
    try {
      await playNext();
    } finally {
      setTimeout(() => setIsNextLoading(false), 300);
    }
  }, [playNext]);

  const handlePrevious = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTime.current < MIN_CLICK_INTERVAL) return;
    lastClickTime.current = now;

    setIsPrevLoading(true);
    try {
      await playPrevious();
    } finally {
      setTimeout(() => setIsPrevLoading(false), 300);
    }
  }, [playPrevious]);

  const handleShuffleToggle = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickTime.current < MIN_CLICK_INTERVAL) return;
    lastClickTime.current = now;

    setIsShuffleLoading(true);
    try {
      await toggleShuffle();
    } finally {
      setTimeout(() => setIsShuffleLoading(false), 300);
    }
  }, [toggleShuffle]);

  const handleKeyPress = (e: KeyboardEvent) => {
    // Space bar - Play/Pause
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      handlePlayPause();
    }
    // Right Arrow - Next Song
    if (e.code === 'ArrowRight' && e.target === document.body) {
      e.preventDefault();
      handleNext();
    }
    // Left Arrow - Previous Song
    if (e.code === 'ArrowLeft' && e.target === document.body) {
      e.preventDefault();
      handlePrevious();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handlePlayPause, handleNext, handlePrevious]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(volume || 1);
    } else {
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    if (currentSong?.source === 'local' && audioRef.current) {
      audioRef.current.currentTime = time;
    } else if (playerRef.current) {
      playerRef.current.seekTo(time, 'seconds');
    }
  };

  const handleError = (err: any) => {
    console.error('Player error:', err);
    setError('Failed to play media');
    setIsLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnail = () => {
    if (!currentSong) return null;
    if (currentSong.thumbnail) return currentSong.thumbnail;
    if (currentSong.source === 'youtube') {
      const videoId = getYouTubeVideoId(currentSong.sourceUrl);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    return null;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-gray-800 p-4">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-12 h-12 bg-dark-secondary rounded overflow-hidden flex-shrink-0">
            {getThumbnail() ? (
              <Image
                src={getThumbnail()!}
                alt={currentSong.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MusicalNoteIcon className="w-6 h-6 text-light-secondary" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{currentSong.title}</h3>
            <p className="text-sm text-light-secondary truncate">
              {currentSong.artist}
            </p>
          </div>
          <div className="flex items-center gap-2 relative">
            <LikeButton songId={currentSong.id} size="sm" />
            {/* Add to Playlist Button (refactored) */}
            <AddToPlaylistDropdown currentSong={currentSong} />
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <button
              onClick={handleShuffleToggle}
              disabled={isShuffleLoading}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-primary' : 'text-light-secondary hover:text-light'
              }`}
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrevious}
              disabled={isPrevLoading}
              className="p-2 text-light-secondary hover:text-light transition-colors"
            >
              <BackwardIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="p-3 bg-primary text-dark rounded-full hover:bg-primary/90 transition-colors relative"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={isNextLoading}
              className="p-2 text-light-secondary hover:text-light transition-colors"
            >
              <ForwardIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-light-secondary">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleProgress}
              className="flex-1 h-1 bg-light-secondary/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <span className="text-xs text-light-secondary">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={handleMuteToggle}
            className="p-2 text-light-secondary hover:text-light transition-colors"
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
              <SpeakerWaveIcon className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-light-secondary/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
        </div>

        {/* Media Players */}
        {currentSong.source === 'local' ? (
          <audio
            ref={audioRef}
            src={currentSong.sourceUrl}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setIsLoading(false);
            }}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
            onError={handleError}
            onPlay={() => {
              if (!hasStartedPlaying) {
                setHasStartedPlaying(true);
                if (currentSong.id && currentSong.id !== lastTrackedSongId.current) {
                  if (trackPlayTimeout.current) {
                    clearTimeout(trackPlayTimeout.current);
                  }
                  trackPlayTimeout.current = setTimeout(() => {
                    addToRecentlyPlayed(currentSong.id);
                    lastTrackedSongId.current = currentSong.id;
                  }, 5000);
                }
              }
            }}
            className="hidden"
          />
        ) : (
          <div className="hidden">
            <ReactPlayer
              ref={playerRef}
              url={currentSong.sourceUrl}
              playing={isPlaying}
              volume={volume}
              onDuration={setDuration}
              onProgress={(state) => setProgress(state.playedSeconds)}
              onReady={() => setIsLoading(false)}
              onError={handleError}
              onStart={() => {
                if (!hasStartedPlaying) {
                  setHasStartedPlaying(true);
                  if (currentSong.id && currentSong.id !== lastTrackedSongId.current) {
                    if (trackPlayTimeout.current) {
                      clearTimeout(trackPlayTimeout.current);
                    }
                    trackPlayTimeout.current = setTimeout(() => {
                      addToRecentlyPlayed(currentSong.id);
                      lastTrackedSongId.current = currentSong.id;
                    }, 5000);
                  }
                }
              }}
              config={{
                youtube: {
                  playerVars: {
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    rel: 0,
                  },
                },
              }}
              width="100%"
              height="100%"
            />
          </div>
        )}
      </div>
    </div>
  );
} 