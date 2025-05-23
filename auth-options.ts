// lib/auth-options.ts
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        expectedRole: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const { email, password, expectedRole } = credentials ?? {};
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

        if (expectedRole !== 'student' && expectedRole !== 'admin') {
          throw new Error('Invalid role');
        }

        if (!email || !password) {
          throw new Error('Missing email or password');
        }

        const res = await fetch(`${baseUrl}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, expectedRole }),
        });
        const body = await res.json();

        if (!body.success) {
          throw new Error(`Login failed: ${body.message}`);
        }

        if (password !== 'password') {
          throw new Error('Incorrect password');
        }

        return {
          id: body.data.id,
          name: body.data.user_name,
          email,
          role: expectedRole,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
