import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // TODO: Implement actual login logic
      const mockUser = {
        id: '1',
        email,
        name: 'Test User',
      };
      set({ user: mockUser, isAuthenticated: true });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implement Google login logic
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Google User',
        avatar: 'https://placehold.co/100x100',
      };
      set({ user: mockUser, isAuthenticated: true });
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      // TODO: Implement logout logic
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore; 