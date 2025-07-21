import { NextResponse } from 'next/server';
import { searchYouTubeVideos } from '@/lib/api/youtube';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Enhanced karaoke search with multiple search strategies
    const searchQueries = [
      `${query} karaoke`,
      `${query} instrumental`,
      `${query} minus one`,
      `${query} backing track`,
      `${query} karaoke version`,
      `${query} instrumental version`
    ];

    let allVideos: any[] = [];
    
    // Search with multiple queries to get better results
    for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to first 3 queries to avoid rate limiting
      try {
        const videos = await searchYouTubeVideos(searchQuery, 5);
        allVideos = [...allVideos, ...videos];
      } catch (error) {
        console.error(`Error searching for "${searchQuery}":`, error);
        continue;
      }
    }

    // Remove duplicates based on video ID
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Enhanced filtering for karaoke videos
    const karaokeVideos = uniqueVideos
      .filter(video => {
        const title = video.title.toLowerCase();
        const description = video.description.toLowerCase();
        const channelTitle = video.channelTitle.toLowerCase();
        
        // Keywords that indicate karaoke or instrumental content
        const karaokeKeywords = [
          'karaoke',
          'instrumental',
          'minus one',
          'backing track',
          'no vocals',
          'karaoke version',
          'instrumental version',
          'accompaniment',
          'backing music',
          'karaoke track'
        ];

        // Check if any karaoke keywords are present
        const hasKaraokeKeyword = karaokeKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        // Additional filtering to exclude non-karaoke content
        const excludeKeywords = [
          'official music video',
          'official video',
          'lyrics',
          'with lyrics',
          'original song',
          'live performance',
          'concert',
          'music video'
        ];

        const hasExcludeKeyword = excludeKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        // Prefer videos from channels that specialize in karaoke
        const karaokeChannels = [
          'karaoke',
          'instrumental',
          'backing',
          'minus one',
          'accompaniment'
        ];

        const isKaraokeChannel = karaokeChannels.some(keyword => 
          channelTitle.includes(keyword)
        );

        return hasKaraokeKeyword && !hasExcludeKeyword;
      })
      .map(video => {
        let id = video.id;
        if (id !== null && id !== undefined && typeof id === 'object' && 'videoId' in id && typeof id.videoId === 'string') {
          id = id.videoId;
        }
        
        // Clean up the title for better display
        let cleanTitle = video.title;
        const titleLower = video.title.toLowerCase();
        
        // Remove common prefixes/suffixes
        const removePatterns = [
          /^karaoke\s*/i,
          /^instrumental\s*/i,
          /^minus one\s*/i,
          /^backing track\s*/i,
          /\s*karaoke\s*$/i,
          /\s*instrumental\s*$/i,
          /\s*minus one\s*$/i,
          /\s*backing track\s*$/i,
          /\s*\(karaoke\)\s*/i,
          /\s*\(instrumental\)\s*/i,
          /\s*\[karaoke\]\s*/i,
          /\s*\[instrumental\]\s*/i
        ];

        removePatterns.forEach(pattern => {
          cleanTitle = cleanTitle.replace(pattern, '');
        });

        // Clean up extra spaces
        cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

        return {
          id,
          title: cleanTitle,
          artist: video.channelTitle,
          duration: video.duration,
          thumbnail: video.thumbnail,
          viewCount: video.viewCount,
          publishedAt: video.publishedAt
        };
      })
      .filter(video => typeof video.id === 'string' && video.id.length === 11)
      .slice(0, 10); // Limit to 10 results

    console.log(`Found ${karaokeVideos.length} karaoke videos for query: "${query}"`);

    return NextResponse.json(karaokeVideos);
  } catch (error) {
    console.error('Error searching karaoke videos:', error);
    return NextResponse.json(
      { error: 'Failed to search karaoke videos. Please check your YouTube API key configuration.' },
      { status: 500 }
    );
  }
} 