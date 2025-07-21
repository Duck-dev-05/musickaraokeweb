import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Create a new song
export async function POST(request: Request) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    // (Authentication temporarily disabled for testing. Re-enable before production!)

    const data = await request.json();
    const { title, artist, duration, source, sourceUrl, thumbnail } = data;

    console.log('Creating/finding song:', { title, artist, source, sourceUrl });

    // Validate required fields
    if (!title || !artist || !duration || !source || !sourceUrl) {
      console.error('Missing required fields:', { title, artist, duration, source, sourceUrl });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if song already exists with the same source URL
    const existingSong = await prisma.song.findFirst({
      where: {
        sourceUrl,
      },
    });

    if (existingSong) {
      console.log('Found existing song:', existingSong.id);
      return NextResponse.json(existingSong);
    }

    // Create new song
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        duration,
        source,
        sourceUrl,
        thumbnail,
      },
    });

    console.log('Created new song:', song.id);
    return NextResponse.json(song, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    // Check for specific Prisma errors
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Song already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create song' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // const session = await getServerSession(authOptions);
    //
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    // (Authentication temporarily disabled for testing. Re-enable before production!)

    const songs = await prisma.song.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        duration: true,
        thumbnail: true,
        source: true,
      },
    });

    return NextResponse.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch songs' },
      { status: 500 }
    );
  }
} 