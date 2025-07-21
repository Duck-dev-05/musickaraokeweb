import { create } from 'zustand';

export type SongSource = 'youtube' | 'mixcloud' | 'local';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  source: SongSource;
  sourceUrl: string;
  thumbnail?: string;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  queue: Song[];
  history: Song[];
  shuffledQueue: Song[];
  isShuffled: boolean;
  hasStartedPlaying: boolean;
  setCurrentSong: (song: Song) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  setQueue: (songs: Song[]) => void;
  setHasStartedPlaying: (hasStarted: boolean) => void;
}

// Helper function to format YouTube URL
const formatYouTubeUrl = (url: string) => {
  // If it's already a full URL, return as is
  if (url.startsWith('http')) return url;
  
  // If it's just an ID, convert to full URL
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return url;
  }
  
  // Assume it's a video ID
  return `https://www.youtube.com/watch?v=${url}`;
};

// All old direct API call code for song management has been deleted.

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  volume: 1,
  queue: [],
  history: [],
  shuffledQueue: [],
  isShuffled: false,
  hasStartedPlaying: false,

  setCurrentSong: async (song) => {
    const { currentSong, history } = get();
    // Add current song to history if it exists
    if (currentSong) {
      set({ history: [currentSong, ...history.slice(0, 49)] }); // Keep last 50 songs
    }

    // Format YouTube URL if needed
    const formattedSong = {
      ...song,
      sourceUrl: song.source === 'youtube' ? formatYouTubeUrl(song.sourceUrl) : song.sourceUrl,
    };

    // Save song to database and add to recently played
    try {
      // const savedSong = await saveSongToDatabase(formattedSong);
      // if (savedSong) {
      //   // Use the saved song with the correct ID from the database
      //   const songWithId = {
      //     ...formattedSong,
      //     id: savedSong.id
      //   };
      //   set({ currentSong: songWithId, isPlaying: true, hasStartedPlaying: false });
        
      //   // Add to recently played after a short delay to ensure the song has started playing
      //   setTimeout(() => {
      //     addToRecentlyPlayed(savedSong.id);
      //   }, 2000);
      // } else {
        // If saving failed, still play the song but log an error
        console.error('Failed to save song to database');
        set({ currentSong: formattedSong, isPlaying: true, hasStartedPlaying: false });
      // }
    } catch (error) {
      console.error('Error tracking song:', error);
      // If there's an error, still play the song
      set({ currentSong: formattedSong, isPlaying: true, hasStartedPlaying: false });
    }
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  setVolume: (volume) => set({ volume }),

  setHasStartedPlaying: (hasStarted) => set({ hasStartedPlaying: hasStarted }),

  addToQueue: (song) => {
    const { queue, shuffledQueue, isShuffled } = get();
    // Format YouTube URL if needed
    const formattedSong = {
      ...song,
      sourceUrl: song.source === 'youtube' ? formatYouTubeUrl(song.sourceUrl) : song.sourceUrl,
    };
    
    const newQueue = [...queue, formattedSong];
    set({ queue: newQueue });
    
    if (isShuffled) {
      // Add new song to a random position in shuffled queue
      const position = Math.floor(Math.random() * (shuffledQueue.length + 1));
      const newShuffledQueue = [...shuffledQueue];
      newShuffledQueue.splice(position, 0, formattedSong);
      set({ shuffledQueue: newShuffledQueue });
    }
  },

  removeFromQueue: (songId) => {
    const { queue, shuffledQueue } = get();
    set({
      queue: queue.filter((song) => song.id !== songId),
      shuffledQueue: shuffledQueue.filter((song) => song.id !== songId),
    });
  },

  clearQueue: () => set({ queue: [], shuffledQueue: [] }),

  playNext: () => {
    const { queue, shuffledQueue, isShuffled, currentSong, history } = get();
    const activeQueue = isShuffled ? shuffledQueue : queue;
    
    if (activeQueue.length === 0) {
      set({ currentSong: null, isPlaying: false });
      return;
    }

    const nextSong = {
      ...activeQueue[0],
      sourceUrl: activeQueue[0].source === 'youtube' ? 
        formatYouTubeUrl(activeQueue[0].sourceUrl) : 
        activeQueue[0].sourceUrl,
    };
    const newQueue = activeQueue.slice(1);

    // Add current song to history if it exists
    if (currentSong) {
      set({ history: [currentSong, ...history.slice(0, 49)] }); // Keep last 50 songs
    }

    if (isShuffled) {
      set({ shuffledQueue: newQueue, currentSong: nextSong });
    } else {
      set({ queue: newQueue, currentSong: nextSong });
    }
  },

  playPrevious: () => {
    const { history, currentSong, queue, shuffledQueue, isShuffled } = get();
    if (history.length === 0) return;

    const previousSong = {
      ...history[0],
      sourceUrl: history[0].source === 'youtube' ? 
        formatYouTubeUrl(history[0].sourceUrl) : 
        history[0].sourceUrl,
    };
    const newHistory = history.slice(1);

    // Add current song back to queue if it exists
    if (currentSong) {
      const activeQueue = isShuffled ? shuffledQueue : queue;
      const newQueue = [currentSong, ...activeQueue];
      if (isShuffled) {
        set({ shuffledQueue: newQueue });
      } else {
        set({ queue: newQueue });
      }
    }

    set({
      currentSong: previousSong,
      history: newHistory,
      isPlaying: true,
    });
  },

  toggleShuffle: () => {
    const { isShuffled, queue, currentSong } = get();
    
    if (!isShuffled) {
      // Create shuffled queue excluding current song
      const remainingQueue = currentSong 
        ? queue.filter(song => song.id !== currentSong.id)
        : [...queue];
      
      // Fisher-Yates shuffle algorithm
      const shuffled = [...remainingQueue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      set({ isShuffled: true, shuffledQueue: shuffled });
    } else {
      set({ isShuffled: false });
    }
  },

  setQueue: (songs) => {
    // Format YouTube URLs in the queue
    const formattedSongs = songs.map(song => ({
      ...song,
      sourceUrl: song.source === 'youtube' ? formatYouTubeUrl(song.sourceUrl) : song.sourceUrl,
    }));

    const { isShuffled } = get();
    set({ queue: formattedSongs });
    
    if (isShuffled) {
      // Create new shuffled queue
      const shuffled = [...formattedSongs];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      set({ shuffledQueue: shuffled });
    }
  },
})); 