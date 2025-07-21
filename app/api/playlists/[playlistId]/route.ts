import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    // Check if user has access to this playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Format the response
    const formattedPlaylist = {
      ...playlist,
      songs: playlist.songs.map(ps => ({
        ...ps.song,
        position: ps.position,
      })),
    };

    return NextResponse.json(formattedPlaylist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { name, description, thumbnail } = await request.json();

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: params.playlistId,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user owns this playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: {
        id: params.playlistId,
      },
      data: {
        name,
        description,
        thumbnail,
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

    // Format the response
    const formattedPlaylist = {
      ...updatedPlaylist,
      songs: updatedPlaylist.songs.map(ps => ({
        ...ps.song,
        position: ps.position,
      })),
    };

    return NextResponse.json(formattedPlaylist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
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

    const playlist = await prisma.playlist.findUnique({
      where: {
        id: params.playlistId,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Check if user owns this playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.playlist.delete({
      where: {
        id: params.playlistId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
} 