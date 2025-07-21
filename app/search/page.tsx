'use client';


import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlayIcon } from '@heroicons/react/24/solid';
import { searchYouTubeVideos, type YouTubeVideo } from '@/lib/api/youtube';
import { searchMixcloudShows, type MixcloudShow } from '@/lib/api/mixcloud';
import { usePlayerStore } from '@/lib/stores/playerStore';
import { useRef } from 'react';

type SearchResults = {
  videos: YouTubeVideo[];
  shows: MixcloudShow[];
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<SearchResults>({ videos: [], shows: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentSong, setQueue } = usePlayerStore();

  useEffect(() => {
    setSearchInput(query);
    if (!query) {
      setResults({ videos: [], shows: [] });
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [videos, shows] = await Promise.all([
          searchYouTubeVideos(query, 8),
          searchMixcloudShows(query, 8),
        ]);

        setResults({ videos, shows });
      } catch (error) {
        console.error('Error searching content:', error);
        setError('Failed to fetch search results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handlePlayVideo = (video: YouTubeVideo, index: number) => {
    // Convert all videos to songs for the queue
    const videoSongs = results.videos.map(v => ({
      id: v.id,
      title: v.title,
      artist: v.channelTitle,
      duration: v.duration,
      source: 'youtube' as const,
      sourceUrl: v.id,
      thumbnail: v.thumbnail,
    }));

    // Set the clicked video as current song
    setCurrentSong({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      duration: video.duration,
      source: 'youtube',
      sourceUrl: video.id,
      thumbnail: video.thumbnail,
    });

    // Add remaining videos to queue
    const remainingVideos = videoSongs.slice(index + 1);
    setQueue(remainingVideos);
  };

  const handlePlayShow = (show: MixcloudShow, index: number) => {
    // Convert all shows to songs for the queue
    const showSongs = results.shows.map(s => ({
      id: s.key,
      title: s.name,
      artist: s.user.name,
      duration: `${Math.floor(s.audio_length / 60)}:${String(s.audio_length % 60).padStart(2, '0')}`,
      source: 'mixcloud' as const,
      sourceUrl: s.url,
      thumbnail: s.pictures.large,
    }));

    // Set the clicked show as current song
    setCurrentSong({
      id: show.key,
      title: show.name,
      artist: show.user.name,
      duration: `${Math.floor(show.audio_length / 60)}:${String(show.audio_length % 60).padStart(2, '0')}`,
      source: 'mixcloud',
      sourceUrl: show.url,
      thumbnail: show.pictures.large,
    });

    // Add remaining shows to queue
    const remainingShows = showSongs.slice(index + 1);
    setQueue(remainingShows);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() === '') return;
    // Update the URL with the new query
    router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7rem)]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)]">
        <p className="text-light-secondary mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-dark px-6 py-2 rounded-full hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search Bar with custom color */}
      <form onSubmit={handleSearchSubmit} className="flex justify-center mt-8 mb-4">
        <input
          ref={inputRef}
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search for music or mixes..."
          className="w-full max-w-xl px-5 py-3 rounded-full bg-gray-800 text-light placeholder:text-light-secondary focus:outline-none focus:ring-2 focus:ring-primary border-none shadow-md transition-colors"
        />
        <button
          type="submit"
          className="ml-2 px-6 py-3 rounded-full bg-dark text-primary font-bold hover:bg-dark-secondary transition-colors"
        >
          Search
        </button>
      </form>

      {(!query || (results.videos.length === 0 && results.shows.length === 0)) && (
        <div className="text-center text-light-secondary mt-12">
          {!query
            ? 'Enter a search term to find music and mixes'
            : `No results found for "${query}"`}
        </div>
      )}

      {query && (results.videos.length > 0 || results.shows.length > 0) && (
        <>
          <h1 className="text-3xl font-bold">Search Results for "{query}"</h1>

          {/* YouTube Results */}
          {results.videos.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Music Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="bg-dark-secondary rounded-lg p-4 hover:bg-secondary transition-colors group cursor-pointer"
                  >
                    <div className="relative mb-4">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handlePlayVideo(video, index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <PlayIcon className="h-12 w-12 text-light" />
                      </button>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-light-secondary">{video.channelTitle}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mixcloud Results */}
          {results.shows.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">DJ Mixes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.shows.map((show, index) => (
                  <div
                    key={show.key}
                    className="bg-dark-secondary rounded-lg p-4 hover:bg-secondary transition-colors group cursor-pointer"
                  >
                    <div className="relative mb-4">
                      <img
                        src={show.pictures.large}
                        alt={show.name}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <button
                        onClick={() => handlePlayShow(show, index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <PlayIcon className="h-12 w-12 text-light" />
                      </button>
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{show.name}</h3>
                    <p className="text-sm text-light-secondary">{show.user.name}</p>
                    <p className="text-xs text-light-secondary mt-1">
                      {Math.floor(show.audio_length / 60)} minutes • {show.play_count.toLocaleString()} plays
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
} 