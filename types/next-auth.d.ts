import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isPremium: boolean;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    isPremium: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isPremium: boolean;
  }
} 