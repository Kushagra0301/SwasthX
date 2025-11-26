// lib/auth.ts

import NextAuth, { getServerSession, type NextAuthOptions } from 'next-auth';
// NextAuth: used to create the auth handler.
// getServerSession: used on the server to read the current session.
// NextAuthOptions: TypeScript type for the config object.

import Credentials from 'next-auth/providers/credentials';
// Credentials provider: username/password (email/password) login.

import { PrismaAdapter } from '@next-auth/prisma-adapter';
// Adapter that connects NextAuth to our Prisma schema.

import prisma from './prisma';
// Our Prisma client instance.

import bcrypt from 'bcryptjs';
// Used to compare plain-text password with hashedPassword stored in DB.

// This is the main NextAuth configuration object.
// We will use it in both the route handler and in getServerSession.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1) Basic check: must have email and password in the request.
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 2) Look up the user by email.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 3) If user not found or no hashedPassword in DB, reject.
        if (!user || !user.hashedPassword) {
          return null;
        }

        // 4) Compare the plain password with the hashed one from DB.
        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        // 5) If password is correct, return a user object.
        //    NextAuth will attach this to the session.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt', // we use JWT-based sessions (no DB sessions needed)
  },

  callbacks: {
    // Called whenever a JWT is created/updated.
    async jwt({ token, user }) {
      // When user logs in for the first time, "user" is defined.
      if (user) {
        token.id = (user as any).id;
      }
      return token;
    },

    // Called whenever a session is checked (e.g., in the browser or server).
    async session({ session, token }) {
      // Attach the user id from token to session.user so we can use it later.
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  // In production, set NEXTAUTH_SECRET in your .env.
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function for server components / API routes to get current session.
export function auth() {
  // This returns a Promise<Session | null>.
  return getServerSession(authOptions);
}
