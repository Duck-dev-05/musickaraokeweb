import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const FREE_USER_SONG_LIMIT = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { localSongs: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!user.isPremium && user.localSongs.length >= FREE_USER_SONG_LIMIT) {
      return NextResponse.json({ error: `Free users can only upload up to ${FREE_USER_SONG_LIMIT} songs.` }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    if (!file || !title || !artist) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    const filepath = path.join('uploads', filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(process.cwd(), 'public', filepath), buffer);
    const localSong = await prisma.localSong.create({
      data: {
        title,
        artist,
        duration: '',
        filePath: filepath,
        fileSize: file.size,
        mimeType: file.type,
        userId: user.id,
      },
    });
    return NextResponse.json(localSong);
  } catch (error) {
    console.error('Error uploading local song:', error);
    return NextResponse.json({ error: 'Failed to upload song' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { localSongs: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ songs: user.localSongs });
  } catch (error) {
    console.error('Error fetching local songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
} 