import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  _count: {
    songs: number;
  };
}

interface PlaylistTableProps {
  playlists: Playlist[];
}

export default function PlaylistTable({ playlists }: PlaylistTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium ?? false;
  const FREE_USER_SONG_LIMIT = 3;

  return (
    <div className="bg-dark-secondary rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-gray-800">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => router.push(`/playlists/${playlist.id}`)}
            className="flex items-center gap-4 p-4 hover:bg-secondary transition-colors cursor-pointer"
          >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              {playlist.thumbnail ? (
                <Image
                  src={playlist.thumbnail}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-dark flex items-center justify-center">
                  <MusicalNoteIcon className="h-8 w-8 text-light-secondary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{playlist.name}</h3>
              {playlist.description && (
                <p className="text-sm text-light-secondary truncate">
                  {playlist.description}
                </p>
              )}
              <p className="text-sm text-light-secondary">
                {playlist._count?.songs ?? 0} {playlist._count?.songs === 1 ? 'song' : 'songs'}
                {!isPremium && (
                  <span className="ml-1">
                    ({playlist._count?.songs ?? 0}/{FREE_USER_SONG_LIMIT})
                  </span>
                )}
              </p>
              {!isPremium && playlist._count?.songs >= FREE_USER_SONG_LIMIT && (
                <p className="text-xs text-primary mt-1">
                  Song limit reached - Upgrade to Premium for unlimited songs
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 