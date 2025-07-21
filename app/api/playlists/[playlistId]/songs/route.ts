import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: params.playlistId,
      },
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Format the response
    const songs = playlist.songs.map(ps => ({
      ...ps.song,
      position: ps.position,
    }));

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist songs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { songId } = await request.json();
    const playlistId = params.playlistId;

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: {
        id: playlistId,
      },
      include: {
        songs: {
          orderBy: {
            position: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: {
        id: songId,
      },
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Check if song is already in playlist
    const existingPlaylistSong = await prisma.playlistSong.findFirst({
      where: {
        AND: [
          { playlistId },
          { songId }
        ]
      }
    });

    if (existingPlaylistSong) {
      return NextResponse.json(
        { error: 'Song already in playlist' },
        { status: 400 }
      );
    }

    // Get the next position
    const nextPosition = (playlist.songs[0]?.position ?? -1) + 1;

    // Add song to playlist
    const playlistSong = await prisma.playlistSong.create({
      data: {
        playlistId,
        songId,
        position: nextPosition,
      },
      include: {
        song: true,
      },
    });

    // Format the response
    const formattedSong = {
      ...playlistSong.song,
      position: playlistSong.position,
    };

    return NextResponse.json(formattedSong);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add song to playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { songId } = await request.json();
    const playlistId = params.playlistId;

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // Check if playlist exists and user owns it
    const playlist = await prisma.playlist.findUnique({
      where: {
        id: playlistId,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove song from playlist
    await prisma.playlistSong.deleteMany({
      where: {
        AND: [
          { playlistId },
          { songId }
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove song from playlist' },
      { status: 500 }
    );
  }
} 