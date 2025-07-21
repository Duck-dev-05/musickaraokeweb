import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's playlists
    const playlists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { songs: true }
        }
      }
    });

    // Get user's liked songs
    const likedSongs = await prisma.likedSong.findMany({
      where: { userId: session.user.id },
      include: {
        song: true
      },
      orderBy: { likedAt: 'desc' }
    });

    // Get recently played songs
    const recentlyPlayed = await prisma.recentlyPlayed.findMany({
      where: { userId: session.user.id },
      include: {
        song: true
      },
      orderBy: { playedAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      playlists: playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.name,
        description: playlist.description,
        songCount: playlist._count.songs,
        thumbnail: playlist.thumbnail || `https://placehold.co/400x400/1DB954/FFFFFF/png?text=${encodeURIComponent(playlist.name)}`
      })),
      likedSongs: likedSongs.map(({ song }) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        thumbnail: song.thumbnail || `https://placehold.co/400x400/1DB954/FFFFFF/png?text=${encodeURIComponent(song.title)}`
      })),
      recentlyPlayed: recentlyPlayed.map(({ song, playedAt }) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        playedAt: playedAt,
        thumbnail: song.thumbnail || `https://placehold.co/400x400/1DB954/FFFFFF/png?text=${encodeURIComponent(song.title)}`
      }))
    });
  } catch (error) {
    console.error('Library fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library data' },
      { status: 500 }
    );
  }
} 