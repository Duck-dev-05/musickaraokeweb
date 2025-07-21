import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify JWT token
      const payload = jwt.verify(token, JWT_SECRET) as any;
      
      if (!payload.userId || !payload.email) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }

      // Find user in database
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          email: true,
          isPremium: true,
          stripeCustomerId: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Do NOT update the DB from the JWT. Only return the DB value.
      return NextResponse.json({
        isPremium: user.isPremium,
        userId: user.id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
        synced: true,
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Premium sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync premium status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const body = await request.json();
    const { isPremium } = body;

    try {
      // Verify JWT token
      const payload = jwt.verify(token, JWT_SECRET) as any;
      
      if (!payload.userId || !payload.email) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }

      // Find and update user's premium status
      const user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: {
          id: true,
          email: true,
          isPremium: true,
          stripeCustomerId: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update premium status
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: isPremium },
        select: {
          id: true,
          email: true,
          isPremium: true,
          stripeCustomerId: true,
        },
      });

      return NextResponse.json({
        isPremium: updatedUser.isPremium,
        userId: updatedUser.id,
        email: updatedUser.email,
        stripeCustomerId: updatedUser.stripeCustomerId,
        updated: true,
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

  } catch (error) {
    console.error('Premium update error:', error);
    return NextResponse.json(
      { error: 'Failed to update premium status' },
      { status: 500 }
    );
  }
} 