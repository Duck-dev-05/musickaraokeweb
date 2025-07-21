import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Google auth endpoint called');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { email, name, idToken } = body;

    if (!email || !name) {
      console.log('Missing required fields:', { email: !!email, name: !!name });
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    console.log('Processing Google auth for:', email);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
      },
    });

    console.log('Existing user found:', !!user);

    if (!user) {
      // Create new user
      console.log('Creating new user for:', email);
      user = await prisma.user.create({
        data: {
          email,
          name,
          isPremium: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          isPremium: true,
        },
      });
      console.log('New user created:', user.id);
    } else {
      // Update existing user's name if it changed
      if (user.name !== name) {
        console.log('Updating user name from', user.name, 'to', name);
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
          select: {
            id: true,
            email: true,
            name: true,
            isPremium: true,
          },
        });
      }
    }

    console.log('Generating tokens for user:', user.id);

    // Generate token pair (access + refresh tokens) with default token version
    const { accessToken, refreshToken } = await generateTokenPair(
      user.id,
      user.email!,
      user.isPremium,
      1 // Default token version since column doesn't exist yet
    );

    console.log('Tokens generated successfully');

    const response = {
      token: accessToken, // Keep 'token' for backward compatibility
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
      },
    };

    console.log('Google auth successful for:', email);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Google authentication error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 