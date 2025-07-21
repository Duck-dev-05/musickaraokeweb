'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon, ForwardIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface KaraokeSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

export default function KaraokePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [songs, setSongs] = useState<KaraokeSong[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const [queue, setQueue] = useState<KaraokeSong[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Persist theme in localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('karaoke-theme');
    if (storedTheme) setIsDarkMode(storedTheme === 'dark');
  }, []);
  useEffect(() => {
    localStorage.setItem('karaoke-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  

  // Update search history
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchHistory((prev) => {
        if (prev[0] === searchQuery) return prev;
        const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)];
        return updated.slice(0, 5);
      });
    }
  }, [searchQuery]);

  // Debounced search function
  const searchKaraoke = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSongs([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/youtube/karaoke?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search karaoke songs');
        
        const data = await response.json();
        setSongs(data);
      } catch (error) {
        console.error('Error searching karaoke:', error);
        setError('Failed to search karaoke songs');
        setSongs([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Handle search input
  useEffect(() => {
    searchKaraoke(searchQuery);
  }, [searchQuery, searchKaraoke]);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API ready');
      
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 1, // Enable autoplay
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          enablejsapi: 1, // Enable JavaScript API
          origin: window.location.origin, // Set origin for security
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            setPlayerReady(true);
          },
          onStateChange: (event: any) => {
            console.log('Player state changed:', event.data);
            const isVideoPlaying = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(isVideoPlaying);
            
            // Auto-play next song when current one ends
            if (event.data === window.YT.PlayerState.ENDED && queue.length > 0) {
              handleNext();
            }
            
            // If video is buffering, ensure we try to play it
            if (event.data === window.YT.PlayerState.BUFFERING && selectedSong) {
              setTimeout(() => {
                if (playerRef.current && playerReady && !isVideoPlaying) {
                  console.log('Attempting to play after buffering');
                  playerRef.current.playVideo();
                }
              }, 500);
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event);
            setError('Invalid YouTube video ID');
            setPlayerReady(false);
            setIsPlaying(false);
          },
        },
      });
    };

    return () => {
      // Cleanup player on unmount
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!playerRef.current || !playerReady || !selectedSong) {
      setError('Player not ready or no song selected.');
      return;
    }
    try {
      const YT = window.YT;
      const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : null;
      // If already playing, pause
      if (playerState === YT?.PlayerState?.PLAYING) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        // Always load the video before playing for reliability
        playerRef.current.loadVideoById({
          videoId: selectedSong,
          startSeconds: 0,
          suggestedQuality: 'default',
        });
        // Try to play after a short delay
        setTimeout(() => {
          if (playerRef.current && playerReady) {
            playerRef.current.playVideo();
            setIsPlaying(true);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error in play/pause:', error);
      setError('Failed to control playback. Please try again.');
    }
  };

  const handleMute = () => {
    if (playerRef.current && playerReady) {
      try {
        if (isMuted) {
          playerRef.current.unMute();
        } else {
          playerRef.current.mute();
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.error('Error in mute/unmute:', error);
        setError('Failed to control audio');
      }
    }
  };

  // --- Robust Song Click Handler ---
  const handleSongSelect = (song: KaraokeSong) => {
    if (!playerRef.current || !playerReady) {
      setError('Player not ready. Please wait a moment and try again.');
      return;
    }

    if (
      typeof song.id === 'string' &&
      /^[a-zA-Z0-9_-]{11}$/.test(song.id)
    ) {
      try {
        setSelectedSong(song.id);
        setIsPlaying(true);
        setError(null);

        // Always load the video
        playerRef.current.loadVideoById({
          videoId: song.id,
          startSeconds: 0,
          suggestedQuality: 'default'
        });

        // Try to play after a short delay
        setTimeout(() => {
          if (playerRef.current && playerReady) {
            playerRef.current.playVideo();
          }
        }, 200);
      } catch (error) {
        console.error('Error loading video:', error);
        setError('Failed to load video. Please try again.');
        setIsPlaying(false);
      }
    } else {
      setError('Invalid YouTube video ID');
      console.error('Invalid video id:', song.id, song);
    }
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      handleSongSelect(nextSong);
      setQueue(queue.slice(1));
    }
  };

  const addToQueue = (song: KaraokeSong) => {
    setQueue((prev) => [...prev, song]);
    toast.success('Added to queue');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className={`flex h-[calc(100vh-7rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden mr-4`}>
        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {/* Always render the YouTube player div for API stability */}
            <div id="youtube-player" className="w-full h-full" />
            {!selectedSong && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎤</div>
                  <h2 className="text-2xl font-bold mb-2">Karaoke</h2>
                  <p className="text-gray-500">Search for songs to start singing!</p>
                  {!playerReady && (
                    <p className="text-sm text-gray-600 mt-2">Loading player...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Controls */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleMute}
              disabled={!playerReady}
              className={`p-3 transition-colors ${
                playerReady 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-6 w-6" />
              ) : (
                <SpeakerWaveIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!playerReady || !selectedSong}
              className={`p-4 rounded-full transition-colors shadow-lg ${
                playerReady && selectedSong
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8 text-white" />
              ) : (
                <PlayIcon className="h-8 w-8 text-white" />
              )}
            </button>
            <button
              onClick={handleNext}
              disabled={queue.length === 0 || !playerReady}
              className={`p-3 transition-colors ${
                queue.length === 0 || !playerReady
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ForwardIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Search Results */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-80 rounded-lg p-6 border-l ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="mb-6">
          <div className="relative flex items-center">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search karaoke songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-12 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${isDarkMode ? 'bg-gray-700 text-yellow-200' : 'bg-gray-200 text-yellow-600'} hover:bg-green-500 hover:text-white transition-colors`}
              title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
          {/* Search Suggestions */}
          {searchHistory.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {searchHistory.filter(q => q !== searchQuery).map((q, idx) => (
                <button
                  key={q + idx}
                  onClick={() => setSearchQuery(q)}
                  className={`px-3 py-1 rounded-full text-xs border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-green-700' : 'bg-gray-200 border-gray-300 text-gray-700 hover:bg-green-100'} transition-colors`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Search Results</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : songs.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {songs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors group cursor-pointer"
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={song.thumbnail}
                      alt={song.title}
                      fill
                      className="object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                      <PlayIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    <p className="text-xs text-gray-500">{song.duration}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue(song);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs text-white bg-blue-600 rounded-full hover:bg-blue-700"
                  >
                    Add to Queue
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <p className="text-gray-400 text-center py-8">No karaoke songs found</p>
          ) : (
            <p className="text-gray-400 text-center py-8">Search for karaoke songs to get started</p>
          )}
        </div>

        {queue.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Queue</h2>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {queue.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-700 group hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => {
                    handleSongSelect(song);
                    setQueue(queue.filter((_, i) => i !== index));
                  }}
                >
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={song.thumbnail}
                      alt={song.title}
                      fill
                      className="object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 