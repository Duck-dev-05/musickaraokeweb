export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let result = '';
  
  if (hours) {
    result += `${hours}:`;
    result += minutes.padStart(2, '0');
  } else {
    result += minutes || '0';
  }
  
  result += `:${seconds.padStart(2, '0')}`;
  
  return result;
}

async function fetchYouTubeData(url: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your environment variables.');
  }

  const response = await fetch(`${url}&key=${apiKey}`);
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('YouTube API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      url: url.split('&key=')[0] // Don't log the API key
    });
    
    if (response.status === 403) {
      throw new Error('YouTube API quota exceeded or invalid API key. Please check your API key configuration.');
    } else if (response.status === 400) {
      throw new Error('Invalid YouTube API request. Please check your search parameters.');
    } else {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }
  }
  
  return response.json();
}

export async function searchYouTubeVideos(query: string, maxResults: number = 12): Promise<YouTubeVideo[]> {
  try {
    console.log(`Searching YouTube for: "${query}"`);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet` +
      `&maxResults=${Math.min(maxResults, 50)}` + // YouTube API limit is 50
      `&q=${encodeURIComponent(query)}` +
      `&type=video` +
      `&videoCategoryId=10` + // Music category
      `&order=relevance` + // Most relevant results first
      `&videoDuration=medium`; // Prefer medium length videos (3-20 minutes)

    const data = await fetchYouTubeData(searchUrl);
    
    if (!data.items?.length) {
      console.log('No search results found for:', query);
      return [];
    }

    console.log(`Found ${data.items.length} search results for: "${query}"`);

    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics` +
      `&id=${videoIds}`;

    const detailsData = await fetchYouTubeData(detailsUrl);
    
    if (!detailsData.items?.length) {
      console.log('No video details found for:', query);
      return [];
    }

    const videos = data.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      if (!details) {
        console.warn('Missing details for video:', item.id.videoId);
        return null;
      }
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        duration: parseDuration(details.contentDetails.duration),
        viewCount: parseInt(details.statistics.viewCount || '0').toLocaleString(),
        publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Successfully processed ${videos.length} videos for: "${query}"`);
    return videos;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw error; // Re-throw to let calling function handle it
  }
}

export async function getPopularMusicVideos(maxResults: number = 12): Promise<YouTubeVideo[]> {
  try {
    console.log('Fetching popular music videos...');
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet` +
      `&maxResults=${Math.min(maxResults, 50)}` +
      `&q=music` +
      `&type=video` +
      `&videoCategoryId=10` + // Music category
      `&order=viewCount` + // Most viewed first
      `&videoDuration=medium`; // Prefer medium length videos

    const data = await fetchYouTubeData(searchUrl);
    
    if (!data.items?.length) {
      console.log('No popular videos found');
      return [];
    }

    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics` +
      `&id=${videoIds}`;

    const detailsData = await fetchYouTubeData(detailsUrl);
    
    if (!detailsData.items?.length) {
      console.log('No video details found');
      return [];
    }

    const videos = data.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      if (!details) {
        console.warn('Missing details for video:', item.id.videoId);
        return null;
      }
      
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        duration: parseDuration(details.contentDetails.duration),
        viewCount: parseInt(details.statistics.viewCount || '0').toLocaleString(),
        publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
      };
    }).filter(Boolean); // Remove null entries

    console.log(`Successfully processed ${videos.length} popular videos`);
    return videos;
  } catch (error) {
    console.error('Error fetching popular music videos:', error);
    throw error; // Re-throw to let calling function handle it
  }
}

// New function specifically for karaoke search
export async function searchKaraokeVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    console.log(`Searching for karaoke videos: "${query}"`);
    
    // Use multiple search strategies for better karaoke results
    const searchQueries = [
      `${query} karaoke`,
      `${query} instrumental`,
      `${query} minus one`,
      `${query} backing track`
    ];

    let allVideos: YouTubeVideo[] = [];
    
    // Search with multiple queries
    for (const searchQuery of searchQueries.slice(0, 2)) { // Limit to avoid rate limiting
      try {
        const videos = await searchYouTubeVideos(searchQuery, Math.ceil(maxResults / 2));
        allVideos = [...allVideos, ...videos];
      } catch (error) {
        console.error(`Error searching for "${searchQuery}":`, error);
        continue;
      }
    }

    // Remove duplicates
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Filter for karaoke-specific content
    const karaokeVideos = uniqueVideos
      .filter(video => {
        const title = video.title.toLowerCase();
        const description = video.description.toLowerCase();
        
        const karaokeKeywords = [
          'karaoke', 'instrumental', 'minus one', 'backing track',
          'no vocals', 'karaoke version', 'instrumental version'
        ];
        
        const excludeKeywords = [
          'official music video', 'official video', 'lyrics',
          'with lyrics', 'original song', 'live performance'
        ];

        const hasKaraokeKeyword = karaokeKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
        
        const hasExcludeKeyword = excludeKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );

        return hasKaraokeKeyword && !hasExcludeKeyword;
      })
      .slice(0, maxResults);

    console.log(`Found ${karaokeVideos.length} karaoke videos for: "${query}"`);
    return karaokeVideos;
  } catch (error) {
    console.error('Error searching karaoke videos:', error);
    throw error;
  }
} 