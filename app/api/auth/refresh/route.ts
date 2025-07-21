import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, refreshAccessToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Get user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        isPremium: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if token version matches (for security) - skip for now since column doesn't exist
    // if (user.tokenVersion !== payload.tokenVersion) {
    //   return NextResponse.json(
    //     { error: 'Token version mismatch' },
    //     { status: 401 }
    //   );
    // }

    // Generate new access token
    const newAccessToken = await refreshAccessToken(refreshToken, {
      userId: user.id,
      email: user.email,
      isPremium: user.isPremium,
    });

    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'Failed to generate new access token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
      },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 