import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface AddToPlaylistDropdownProps {
  currentSong: any;
}

export default function AddToPlaylistDropdown({ currentSong }: AddToPlaylistDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch playlists when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetch('/api/playlists')
        .then(res => res.json())
        .then(data => setUserPlaylists(data.playlists || []));
    }
  }, [showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleAdd = async (playlistId: string) => {
    if (!currentSong) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId: currentSong.id }),
      });
      if (!res.ok) throw new Error('Failed to add to playlist');
      toast.success('Added to playlist!');
      setShowDropdown(false);
    } catch (err) {
      toast.error('Failed to add to playlist');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDropdown(v => !v)}
        className="p-2 text-light-secondary hover:text-primary transition-colors"
        title="Add to Playlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v12m0 0l-3-3m3 3l3-3M3 6h13.5" />
        </svg>
      </button>
      {showDropdown && (
        <div ref={dropdownRef} className="absolute z-50 top-10 right-0 bg-dark-secondary border border-gray-700 rounded shadow-lg w-56">
          <div className="p-2 text-sm font-semibold text-light-secondary">Add to Playlist</div>
          <div className="max-h-60 overflow-y-auto">
            {userPlaylists.length === 0 ? (
              <div className="p-2 text-light-secondary">No playlists found.</div>
            ) : (
              userPlaylists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  className="w-full text-left px-4 py-2 hover:bg-primary/10 text-light block disabled:opacity-60"
                  disabled={isAdding}
                >
                  {pl.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
} 