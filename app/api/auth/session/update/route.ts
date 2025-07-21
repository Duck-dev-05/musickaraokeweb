import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../[...nextauth]/route';
import { getToken, encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current token
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Update the token with latest user data
    const updatedToken = { ...token, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };

    // Encode the updated token
    const encodedToken = await encode({
      token: updatedToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Set the new session token cookie
    cookies().set('next-auth.session-token', encodedToken, {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 