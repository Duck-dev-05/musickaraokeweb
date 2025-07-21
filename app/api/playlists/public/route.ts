import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user to check if they're premium
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For non-premium users, show playlists from premium users and some curated content
    // For premium users, show all playlists
    let playlists;
    
    if (currentUser.isPremium) {
      // Premium users can see all playlists
      playlists = await prisma.playlist.findMany({
        include: {
          _count: {
            select: { songs: true },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isPremium: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Non-premium users can see playlists from premium users and some curated content
      playlists = await prisma.playlist.findMany({
        where: {
          user: {
            isPremium: true,
          },
        },
        include: {
          _count: {
            select: { songs: true },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isPremium: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit for non-premium users
      });
    }

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching public playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
} 