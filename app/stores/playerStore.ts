import { create } from 'zustand';

type SongSource = 'youtube' | 'mixcloud';

interface Song {
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
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  playNext: () => void;
}

const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  isPlaying: false,
  volume: 1,
  queue: [],
  setCurrentSong: (song) => set({ currentSong: song, isPlaying: !!song }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
  removeFromQueue: (songId) =>
    set((state) => ({
      queue: state.queue.filter((song) => song.id !== songId),
    })),
  playNext: () =>
    set((state) => {
      if (state.queue.length === 0) {
        return { currentSong: null, isPlaying: false };
      }
      const [nextSong, ...remainingQueue] = state.queue;
      return {
        currentSong: nextSong,
        queue: remainingQueue,
        isPlaying: true,
      };
    }),
}));

export default usePlayerStore; 