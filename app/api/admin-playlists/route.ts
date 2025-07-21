import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

function isAuthorized(request: Request) {
  const key = request.headers.get('x-admin-api-key');
  return key && ADMIN_API_KEY && key === ADMIN_API_KEY;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const playlists = await prisma.playlist.findMany({
    select: { id: true, name: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(playlists);
}

// Optionally, add POST, PUT, DELETE for full CRUD if needed 