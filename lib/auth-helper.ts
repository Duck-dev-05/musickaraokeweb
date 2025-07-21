import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { verifyJwtToken } from '@/lib/jwt';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  isPremium?: boolean;
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    // First try JWT token authentication (for mobile apps)
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await verifyJwtToken(token);
        if (payload) {
          return {
            id: payload.userId,
            email: payload.email,
            isPremium: payload.isPremium,
          };
        }
      }
    }

    // Fallback to NextAuth session (for web apps)
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      return {
        id: session.user.id || '',
        email: session.user.email,
        isPremium: session.user.isPremium || false,
      };
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
} 