import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter an email and password');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            throw new Error('No user found with this email');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            isPremium: user.isPremium
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    jwt: async ({ token, user, trigger }) => {
      try {
        if (user) {
          token.id = user.id;
        }
        
        // Always fetch latest premium status on token refresh
        if (trigger === 'update' || user) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          });
          token.isPremium = dbUser?.isPremium ?? false;
        }
        
        return token;
      } catch (error) {
        console.error('JWT error:', error);
        return token;
      }
    },
    session: async ({ session, token }) => {
      try {
        if (session?.user) {
          session.user.id = token.id as string;
          session.user.isPremium = token.isPremium as boolean;
        }
        return session;
      } catch (error) {
        console.error('Session error:', error);
        return session;
      }
    },
    redirect: async ({ url, baseUrl }) => {
      try {
        // Always allow relative URLs
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // Allow redirects to the same origin
        if (url.startsWith(baseUrl)) {
          return url;
        }
        // Default fallback
        return baseUrl;
      } catch (error) {
        console.error('Redirect error:', error);
        return baseUrl;
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error('NextAuth error:', { code, metadata });
    },
    warn(code) {
      console.warn('NextAuth warning:', code);
    },
    debug(code, metadata) {
      console.debug('NextAuth debug:', { code, metadata });
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 