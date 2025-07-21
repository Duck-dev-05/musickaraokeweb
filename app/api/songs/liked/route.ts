import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Get all liked songs for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const likedSongs = await prisma.likedSong.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        song: true,
      },
      orderBy: {
        likedAt: 'desc',
      },
    });

    return NextResponse.json(likedSongs);
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked songs' },
      { status: 500 }
    );
  }
}

// Like a song
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // Check if song exists
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Add to liked songs
    const likedSong = await prisma.likedSong.create({
      data: {
        userId: session.user.id,
        songId: songId,
        likedAt: new Date(),
      },
      include: {
        song: true,
      },
    });

    return NextResponse.json(likedSong);
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Song already liked' },
        { status: 400 }
      );
    }
    console.error('Error liking song:', error);
    return NextResponse.json(
      { error: 'Failed to like song' },
      { status: 500 }
    );
  }
}

// Unlike a song
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      );
    }

    // Remove from liked songs
    await prisma.likedSong.delete({
      where: {
        userId_songId: {
          userId: session.user.id,
          songId: songId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Song not liked' },
        { status: 404 }
      );
    }
    console.error('Error unliking song:', error);
    return NextResponse.json(
      { error: 'Failed to unlike song' },
      { status: 500 }
    );
  }
} 