import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const FREE_USER_PLAYLIST_LIMIT = 3; // Maximum playlists for free users

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const playlists = await prisma.playlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { songs: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find all "New Playlist" entries except the most recent one
    const duplicatePlaylists = await prisma.playlist.findMany({
      where: {
        userId: session.user.id,
        name: 'New Playlist',
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 1, // Skip the most recent one
    });

    // Delete all duplicate playlists
    if (duplicatePlaylists.length > 0) {
      await prisma.playlist.deleteMany({
        where: {
          id: {
            in: duplicatePlaylists.map(p => p.id)
          }
        }
      });
    }

    return NextResponse.json({ 
      message: `Deleted ${duplicatePlaylists.length} duplicate playlists`,
      deletedCount: duplicatePlaylists.length 
    });
  } catch (error) {
    console.error('Error deleting duplicate playlists:', error);
    return NextResponse.json(
      { error: 'Failed to delete duplicate playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is premium
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isPremium: true,
        _count: {
          select: { playlists: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check playlist limit for non-premium users
    if (!user.isPremium && user._count.playlists >= FREE_USER_PLAYLIST_LIMIT) {
      return NextResponse.json(
        { 
          error: 'Playlist limit reached',
          message: `Free users can only create up to ${FREE_USER_PLAYLIST_LIMIT} playlists. Upgrade to Premium for unlimited playlists!`,
          code: 'PLAYLIST_LIMIT_REACHED'
        },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { songs: true },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
} 