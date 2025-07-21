import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { getToken, encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Update user to premium in database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { isPremium: true },
    });

    // Get the current token
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }

    // Update token with new premium status
    const updatedToken = {
      ...token,
      isPremium: true,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

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

    return NextResponse.json({ 
      success: true,
      user: {
        ...session.user,
        isPremium: true
      }
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
} 