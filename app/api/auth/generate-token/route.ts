import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateTokenPair } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isPremium: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token pair (access + refresh tokens)
    const { accessToken, refreshToken } = await generateTokenPair(
      user.id,
      user.email!,
      user.isPremium,
      1 // Default token version since column doesn't exist yet
    );

    return NextResponse.json({
      token: accessToken, // Keep 'token' for backward compatibility
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
      },
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 