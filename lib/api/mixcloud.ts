export interface MixcloudShow {
  key: string;
  url: string;
  name: string;
  audio_length: number;
  play_count: number;
  user: {
    name: string;
    username: string;
    pictures: {
      small: string;
      medium: string;
      large: string;
    };
  };
  pictures: {
    small: string;
    medium: string;
    large: string;
  };
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatPlayCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export async function searchMixcloudShows(query: string, limit: number = 12): Promise<MixcloudShow[]> {
  try {
    const response = await fetch(
      `https://api.mixcloud.com/search/?q=${encodeURIComponent(query)}&type=cloudcast&limit=${limit}`,
      { next: { revalidate: 60 } } // Cache for 1 minute for search results
    );

    if (!response.ok) {
      throw new Error('Failed to search shows');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching Mixcloud shows:', error);
    return [];
  }
}

export async function getPopularShows(limit: number = 12): Promise<MixcloudShow[]> {
  try {
    const response = await fetch(
      `https://api.mixcloud.com/discover/popular/?limit=${limit}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch shows');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Mixcloud shows:', error);
    return [];
  }
} 