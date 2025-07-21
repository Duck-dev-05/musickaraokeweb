"use client";

import { useEffect, useState, useRef } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  thumbnail?: string;
  source?: string;
  sourceUrl?: string;
}

interface LocalSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const sourceColors: Record<string, string> = {
  youtube: "bg-red-600 text-white",
  mixcloud: "bg-blue-600 text-white",
  local: "bg-green-600 text-white",
};

const TABS = [
  { key: "youtube", label: "YouTube" },
  { key: "mixcloud", label: "Mixcloud" },
  { key: "local", label: "Local" },
];

const FREE_USER_SONG_LIMIT = 10; // Should match backend

export default function SongsPage() {
  const [youtubeSongs, setYoutubeSongs] = useState<Song[]>([]);
  const [mixcloudSongs, setMixcloudSongs] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<LocalSong[]>([]);
  const [loading, setLoading] = useState({
    youtube: true,
    mixcloud: true,
    local: true
  });
  const [error, setError] = useState({
    youtube: null as string | null,
    mixcloud: null as string | null,
    local: null as string | null
  });
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("youtube");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const uploadForm = useRef<HTMLFormElement>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [tabFetched, setTabFetched] = useState<{ [key: string]: boolean }>({ youtube: false, mixcloud: false, local: false });

  // Fetch only when tab is selected (or on first visit)
  useEffect(() => {
    if (!tabFetched[activeTab]) {
      if (activeTab === "youtube") fetchYoutubeSongs();
      if (activeTab === "mixcloud") fetchMixcloudSongs();
      if (activeTab === "local") fetchLocalSongs();
      setTabFetched(prev => ({ ...prev, [activeTab]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function fetchYoutubeSongs() {
    setLoading(prev => ({ ...prev, youtube: true }));
    setError(prev => ({ ...prev, youtube: null }));
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) throw new Error("Failed to fetch YouTube songs");
      const data = await res.json();
      const youtubeData = data.filter((song: Song) => song.source === 'youtube');
      setYoutubeSongs(youtubeData);
    } catch (err: any) {
      setError(prev => ({ ...prev, youtube: err.message || "Failed to fetch YouTube songs" }));
    } finally {
      setLoading(prev => ({ ...prev, youtube: false }));
    }
  }

  async function fetchMixcloudSongs() {
    setLoading(prev => ({ ...prev, mixcloud: true }));
    setError(prev => ({ ...prev, mixcloud: null }));
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) throw new Error("Failed to fetch Mixcloud songs");
      const data = await res.json();
      const mixcloudData = data.filter((song: Song) => song.source === 'mixcloud');
      setMixcloudSongs(mixcloudData);
    } catch (err: any) {
      setError(prev => ({ ...prev, mixcloud: err.message || "Failed to fetch Mixcloud songs" }));
    } finally {
      setLoading(prev => ({ ...prev, mixcloud: false }));
    }
  }

  async function fetchLocalSongs() {
    setLoading(prev => ({ ...prev, local: true }));
    setError(prev => ({ ...prev, local: null }));
    try {
      const res = await fetch("/api/songs/local");
      if (!res.ok) throw new Error("Failed to fetch local songs");
      const data = await res.json();
      setLocalSongs(data.songs || []);
    } catch (err: any) {
      setError(prev => ({ ...prev, local: err.message || "Failed to fetch local songs" }));
    } finally {
      setLoading(prev => ({ ...prev, local: false }));
    }
  }

  async function fetchUserStatus() {
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsPremium(!!data.isPremium);
    } catch {
      setIsPremium(null);
    }
  }

  // Combine all songs for search/filter
  const allSongs = [
    ...youtubeSongs.map(s => ({ ...s, source: "youtube" })),
    ...mixcloudSongs.map(s => ({ ...s, source: "mixcloud" })),
    ...localSongs.map(s => ({ ...s, source: "local" })),
  ];

  const filteredAllSongs = allSongs.filter(song => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      ("album" in song && (song as Song).album?.toLowerCase().includes(q))
    );
  });

  // Filtered songs for each tab
  const filteredYoutube = youtubeSongs.filter(song => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album?.toLowerCase().includes(q)
    );
  });
  const filteredMixcloud = mixcloudSongs.filter(song => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album?.toLowerCase().includes(q)
    );
  });
  const filteredLocal = localSongs.filter(song => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q)
    );
  });

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await fetch("/api/songs/local", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed to upload song");
        setUploading(false);
        return;
      }
      setUploadSuccess("Song uploaded successfully!");
      form.reset();
      fetchLocalSongs();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload song");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">All Songs</h1>
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-800 p-1 border border-gray-700">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(""); }}
                className={`px-6 py-2 rounded-md font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:z-10
                  ${activeTab === tab.key ? 'bg-green-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Search bar */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label} songs...`}
            className={`w-full max-w-lg px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow placeholder-gray-400 ${search ? 'text-blue-400' : 'text-gray-300'}`}
          />
        </div>
        {/* Tab Content */}
        <div>
          {activeTab === "youtube" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {loading.youtube ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-gray-800 animate-pulse p-4 h-56 flex flex-col gap-3">
                    <div className="h-32 bg-gray-700 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                ))
              ) : filteredYoutube.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-16">
                  No YouTube songs found.
                </div>
              ) : (
                filteredYoutube.map((song: any) => (
                  <div
                    key={song.id}
                    className="rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg p-4 flex flex-col h-56 group cursor-pointer relative"
                  >
                    <div className="relative h-32 w-full mb-3">
                      {song.thumbnail ? (
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="object-cover rounded-lg w-full h-full min-h-[8rem] max-h-32"
                        />
                      ) : (
                        <div className="bg-gray-700 rounded-lg w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                          ♫
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold shadow bg-red-600 text-white">
                        YouTube
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="font-semibold text-lg text-white truncate" title={song.title}>{song.title}</div>
                        <div className="text-gray-400 text-sm truncate" title={song.artist}>{song.artist}</div>
                        {song.album && <div className="text-gray-500 text-xs truncate">Album: {song.album}</div>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {song.duration && <span className="text-xs text-gray-400">{song.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === "mixcloud" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {loading.mixcloud ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-gray-800 animate-pulse p-4 h-56 flex flex-col gap-3">
                    <div className="h-32 bg-gray-700 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                  </div>
                ))
              ) : filteredMixcloud.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-16">
                  No Mixcloud songs found.
                </div>
              ) : (
                filteredMixcloud.map((song: any) => (
                  <div
                    key={song.id}
                    className="rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg p-4 flex flex-col h-56 group cursor-pointer relative"
                  >
                    <div className="relative h-32 w-full mb-3">
                      {song.thumbnail ? (
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="object-cover rounded-lg w-full h-full min-h-[8rem] max-h-32"
                        />
                      ) : (
                        <div className="bg-gray-700 rounded-lg w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                          ♫
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold shadow bg-blue-600 text-white">
                        Mixcloud
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="font-semibold text-lg text-white truncate" title={song.title}>{song.title}</div>
                        <div className="text-gray-400 text-sm truncate" title={song.artist}>{song.artist}</div>
                        {song.album && <div className="text-gray-500 text-xs truncate">Album: {song.album}</div>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {song.duration && <span className="text-xs text-gray-400">{song.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === "local" && (
            <>
              {/* Upload Form for Local Songs */}
              <form
                ref={uploadForm}
                onSubmit={handleUpload}
                className="mb-8 max-w-xl mx-auto bg-gray-800 p-6 rounded-lg shadow border border-gray-700 flex flex-col gap-4"
                encType="multipart/form-data"
              >
                <h2 className="text-lg font-semibold text-white mb-2">Upload Local Song</h2>
                <input
                  type="file"
                  name="file"
                  accept="audio/*"
                  required
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-700 file:text-white hover:file:bg-green-600"
                />
                <input
                  type="text"
                  name="title"
                  placeholder="Song Title"
                  required
                  className="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  name="artist"
                  placeholder="Artist"
                  required
                  className="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  name="duration"
                  placeholder="Duration (e.g. 3:45)"
                  required
                  className="px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload Song"}
                </button>
                {uploadError && <div className="text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-2 mt-2">{uploadError}</div>}
                {uploadSuccess && <div className="text-green-400 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-2 mt-2">{uploadSuccess}</div>}
              </form>
              {/* Local Songs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {loading.local ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl bg-gray-800 animate-pulse p-4 h-56 flex flex-col gap-3">
                      <div className="h-32 bg-gray-700 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                    </div>
                  ))
                ) : filteredLocal.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-16">
                    No local songs found.
                  </div>
                ) : (
                  filteredLocal.map((song: any) => (
                    <div
                      key={song.id}
                      className="rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors shadow-lg p-4 flex flex-col h-56 group cursor-pointer relative"
                    >
                      <div className="relative h-32 w-full mb-3">
                        {song.filePath ? (
                          <img
                            src={`/${song.filePath}`}
                            alt={song.title}
                            className="object-cover rounded-lg w-full h-full min-h-[8rem] max-h-32"
                          />
                        ) : (
                          <div className="bg-gray-700 rounded-lg w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                            ♫
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold shadow bg-green-600 text-white">
                          Local
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-semibold text-lg text-white truncate" title={song.title}>{song.title}</div>
                          <div className="text-gray-400 text-sm truncate" title={song.artist}>{song.artist}</div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          {song.duration && <span className="text-xs text-gray-400">{song.duration}</span>}
                          {song.fileSize && (
                            <span className="text-xs text-gray-400">{Math.round(song.fileSize / 1024 / 1024 * 100) / 100} MB</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
        {(error.youtube || error.mixcloud || error.local) && (
          <div className="mt-8 text-center">
            {error.youtube && <div className="text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 mb-2">{error.youtube}</div>}
            {error.mixcloud && <div className="text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 mb-2">{error.mixcloud}</div>}
            {error.local && <div className="text-red-400 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 mb-2">{error.local}</div>}
          </div>
        )}
      </div>
    </div>
  );
} 