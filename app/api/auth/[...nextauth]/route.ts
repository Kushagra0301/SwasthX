// app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
// NextAuth is used here to create the route handler from our options.

import { authOptions } from '@/lib/auth';
// We import the authOptions we defined in lib/auth.ts.

const handler = NextAuth(authOptions);
// This creates a single handler function that can handle GET and POST.

export { handler as GET, handler as POST };
// Next.js App Router uses GET and POST exports for HTTP methods.
