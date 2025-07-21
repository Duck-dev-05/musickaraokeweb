import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

function isAuthorized(request: Request) {
  const key = request.headers.get('x-admin-api-key');
  console.log('[admin-users] API route: env key =', ADMIN_API_KEY, 'header key =', key);
  return key && ADMIN_API_KEY && key === ADMIN_API_KEY;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, email } = await request.json();
  if (!name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const user = await prisma.user.create({ data: { name, email } });
  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, name, email } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }
  const user = await prisma.user.update({ where: { id }, data: { name, email } });
  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
} 