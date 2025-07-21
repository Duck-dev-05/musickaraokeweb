import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { stripeCustomerId: true, stripeSubscriptionId: true, isPremium: true }
    });

    // DEV/TEST: If user isPremium but has no subscription, return mock subscription
    if (dbUser?.isPremium && !dbUser.stripeSubscriptionId) {
      return NextResponse.json({
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancelAtPeriodEnd: false,
        mock: true,
        note: 'This is a mock subscription for dev/testing only.'
      });
    }

    if (!dbUser?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const subscription = await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId);

    return NextResponse.json({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
} 