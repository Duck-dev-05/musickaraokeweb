
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  thumbnail?: string;
  createdAt: string;
  _count?: { songs: number };
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    isPremium: boolean;
  };
}

interface User {
  isPremium: boolean;
}

export default function PlaylistsPage() {
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState({
    user: true,
    public: true
  });
  const [error, setError] = useState({
    user: null as string | null,
    public: null as string | null
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    user: Playlist[];
    public: Playlist[];
  }>({ user: [], public: [] });

  // Create playlist modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
    fetchUserPlaylists();
    fetchPublicPlaylists();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({ user: userPlaylists, public: publicPlaylists });
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const filteredUser = userPlaylists.filter(playlist => 
      playlist.name.toLowerCase().includes(query) ||
      (playlist.description && playlist.description.toLowerCase().includes(query))
    );

    const filteredPublic = publicPlaylists.filter(playlist => 
      playlist.name.toLowerCase().includes(query) ||
      (playlist.description && playlist.description.toLowerCase().includes(query)) ||
      (playlist.user && (
        playlist.user.name?.toLowerCase().includes(query) ||
        playlist.user.email?.toLowerCase().includes(query)
      ))
    );

    setSearchResults({ user: filteredUser, public: filteredPublic });
  }, [searchQuery, userPlaylists, publicPlaylists]);

  async function fetchUserInfo() {
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to fetch user info");
      const userData = await res.json();
      setUser(userData);
    } catch (err: any) {
      console.error("Error fetching user info:", err);
    }
  }

  async function fetchUserPlaylists() {
    setLoading(prev => ({ ...prev, user: true }));
    setError(prev => ({ ...prev, user: null }));
    try {
      const res = await fetch("/api/playlists");
      if (!res.ok) throw new Error("Failed to fetch user playlists");
      const data = await res.json();
      setUserPlaylists(data);
    } catch (err: any) {
      setError(prev => ({ ...prev, user: err.message || "Failed to fetch user playlists" }));
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  }

  async function fetchPublicPlaylists() {
    setLoading(prev => ({ ...prev, public: true }));
    setError(prev => ({ ...prev, public: null }));
    try {
      const res = await fetch("/api/playlists/public");
      if (!res.ok) throw new Error("Failed to fetch public playlists");
      const data = await res.json();
      setPublicPlaylists(data);
    } catch (err: any) {
      setError(prev => ({ ...prev, public: err.message || "Failed to fetch public playlists" }));
    } finally {
      setLoading(prev => ({ ...prev, public: false }));
    }
  }

  async function handleCreatePlaylist(e: React.FormEvent) {
    e.preventDefault();
    
    if (!createForm.name.trim()) {
      setCreateError("Playlist name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'PLAYLIST_LIMIT_REACHED') {
          setCreateError(data.message);
        } else {
          setCreateError(data.error || "Failed to create playlist");
        }
        return;
      }

      // Add the new playlist to the user's playlists
      setUserPlaylists(prev => [data, ...prev]);
      
      // Reset form and close modal
      setCreateForm({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  }

  const PlaylistCard = ({ playlist, type }: { playlist: Playlist, type: 'user' | 'public' }) => (
    <Link href={`/playlists/${playlist.id}`}>
      <li className="p-4 border border-gray-700 rounded-lg bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group hover:bg-gray-750">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-semibold text-lg text-white group-hover:text-green-400 transition-colors">
              {playlist.name}
            </div>
            {playlist.description && (
              <div className="text-gray-300 text-sm mt-1">{playlist.description}</div>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {playlist._count && (
                <span>{playlist._count.songs} songs</span>
              )}
              {type === 'public' && playlist.user && (
                <span className="flex items-center gap-1">
                  <span>by {playlist.user.name || playlist.user.email}</span>
                  {playlist.user.isPremium && (
                    <span className="bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded text-xs font-medium">
                      Premium
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          {playlist.thumbnail && (
            <img 
              src={playlist.thumbnail} 
              alt={playlist.name} 
              className="w-16 h-16 object-cover rounded ml-4"
            />
          )}
        </div>
      </li>
    </Link>
  );

  const SectionHeader = ({ title, count, loading, isPremium, showCreateButton }: { 
    title: string, 
    count: number, 
    loading: boolean,
    isPremium?: boolean,
    showCreateButton?: boolean
  }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {isPremium && (
          <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs font-medium">
            Premium
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : (
          <span className="text-gray-400 text-sm">{count} playlists</span>
        )}
        {showCreateButton && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Playlist
          </button>
        )}
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border border-gray-700 rounded-lg bg-gray-800 animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );

  const CreatePlaylistModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Create New Playlist</h3>
          <button
            onClick={() => {
              setShowCreateModal(false);
              setCreateForm({ name: '', description: '' });
              setCreateError(null);
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          {createError && (
            <div className="text-red-400 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-sm">
              {createError}
            </div>
          )}

          <div>
            <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-300 mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              id="playlist-name"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter playlist name"
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="playlist-description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="playlist-description"
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="Enter playlist description"
              rows={3}
              maxLength={500}
            />
          </div>

          {user && !user.isPremium && (
            <div className="text-sm text-gray-300 bg-yellow-900 bg-opacity-50 border border-yellow-700 p-3 rounded-lg">
              <strong className="text-yellow-200">Note:</strong> Free users can create up to 3 playlists. 
              {userPlaylists.length >= 3 && (
                <span className="text-red-400 block mt-1">
                  You've reached your limit. Upgrade to Premium for unlimited playlists!
                </span>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ name: '', description: '' });
                setCreateError(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !createForm.name.trim()}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Playlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Playlists</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg"
              placeholder="Search playlists..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-center mt-2 text-gray-400 text-sm">
              Found {searchResults.user.length + searchResults.public.length} playlist{searchResults.user.length + searchResults.public.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User's Playlists Section */}
          <div className="space-y-4">
            <SectionHeader 
              title="My Playlists" 
              count={searchQuery ? searchResults.user.length : userPlaylists.length} 
              loading={loading.user}
              showCreateButton={true}
            />
            {error.user && (
              <div className="text-red-400 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">{error.user}</div>
            )}
            {loading.user ? (
              <LoadingSkeleton />
            ) : (
              <ul className="space-y-3">
                {(searchQuery ? searchResults.user : userPlaylists).map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} type="user" />
                ))}
                {(searchQuery ? searchResults.user : userPlaylists).length === 0 && (
                  <li className="p-4 border border-gray-700 rounded-lg bg-gray-800 text-center text-gray-400">
                    {searchQuery ? 'No playlists found matching your search.' : 'No playlists yet. Create your first playlist!'}
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Public Playlists Section */}
          <div className="space-y-4">
            <SectionHeader 
              title="Discover Playlists" 
              count={searchQuery ? searchResults.public.length : publicPlaylists.length} 
              loading={loading.public}
              isPremium={user?.isPremium}
            />
            {error.public && (
              <div className="text-red-400 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">{error.public}</div>
            )}
            {loading.public ? (
              <LoadingSkeleton />
            ) : (
              <ul className="space-y-3">
                {(searchQuery ? searchResults.public : publicPlaylists).map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} type="public" />
                ))}
                {(searchQuery ? searchResults.public : publicPlaylists).length === 0 && (
                  <li className="p-4 border border-gray-700 rounded-lg bg-gray-800 text-center text-gray-400">
                    {searchQuery ? 'No playlists found matching your search.' : 'No public playlists available'}
                  </li>
                )}
              </ul>
            )}
            
            {/* Premium Upgrade Notice for Non-Premium Users */}
            {user && !user.isPremium && !searchQuery && (
              <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg">
                <h3 className="font-semibold text-blue-300 mb-2">Upgrade to Premium</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Get unlimited access to all playlists and create unlimited playlists of your own!
                </p>
                <Link 
                  href="/premium" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Upgrade Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Create Playlist Modal */}
        {showCreateModal && <CreatePlaylistModal />}
      </div>
    </div>
  );
} 