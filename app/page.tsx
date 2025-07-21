'use client';

import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getPopularMusicVideos, type YouTubeVideo } from '@/lib/api/youtube';
import { getPopularShows, type MixcloudShow, formatDuration, formatPlayCount } from '@/lib/api/mixcloud';
import { usePlayerStore } from '@/lib/stores/playerStore';

export default function HomePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [shows, setShows] = useState<MixcloudShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentSong } = usePlayerStore();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [fetchedVideos, fetchedShows] = await Promise.all([
          getPopularMusicVideos(6),
          getPopularShows(6)
        ]);

        setVideos(fetchedVideos || []);
        setShows(fetchedShows || []);
      } catch (error) {
        console.error('Error fetching content:', error);
        setVideos([]);
        setShows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handlePlayVideo = (video: YouTubeVideo) => {
    setCurrentSong({
      id: video.id,
      title: video.title,
      artist: video.channelTitle,
      duration: video.duration,
      source: 'youtube',
      sourceUrl: video.id,
      thumbnail: video.thumbnail,
    });
  };

  const handlePlayShow = (show: MixcloudShow) => {
    setCurrentSong({
      id: show.key,
      title: show.name,
      artist: show.user.name,
      duration: formatDuration(show.audio_length),
      source: 'mixcloud',
      sourceUrl: show.url,
      thumbnail: show.pictures.large,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Popular Music Videos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Popular Music Videos</h2>
          <Link
            href="/songs"
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos && videos.map((video) => (
            <div
              key={video.id}
              className="bg-dark-secondary rounded-lg p-4 hover:bg-secondary transition-colors group cursor-pointer"
              onClick={() => handlePlayVideo(video)}
            >
              <div className="relative mb-4">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video rounded-lg object-cover"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs">
                  {video.duration}
                </div>
              </div>
              <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-light-secondary">{video.channelTitle}</p>
              <p className="text-xs text-light-secondary mt-1">
                {video.viewCount} views • {video.publishedAt}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Shows */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Popular Shows</h2>
          <Link
            href="/shows"
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shows && shows.map((show) => (
            <div
              key={show.key}
              className="bg-dark-secondary rounded-lg p-4 hover:bg-secondary transition-colors group cursor-pointer"
              onClick={() => handlePlayShow(show)}
            >
              <div className="relative mb-4">
                <img
                  src={show.pictures.large}
                  alt={show.name}
                  className="w-full aspect-square rounded-lg object-cover"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs">
                  {formatDuration(show.audio_length)}
                </div>
              </div>
              <h3 className="font-medium mb-1 line-clamp-2">{show.name}</h3>
              <p className="text-sm text-light-secondary">{show.user.name}</p>
              <p className="text-xs text-light-secondary mt-1">
                {formatPlayCount(show.play_count)} plays
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
