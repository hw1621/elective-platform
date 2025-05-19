import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import { JWT } from 'next-auth/jwt'
import { NextAuthOptions, Session, User } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        expectedRole: { label: 'Role', type: 'text' },
      },
      async authorize(credentials) {
        const { email, password, expectedRole } = credentials ?? {}
        return {
          id: '1',
          name: expectedRole,
          email,
          role: expectedRole,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User}) {
      if (user) token.role = user.role
      return token
    },
    async session({ session, token }: { session: Session; token: JWT}) {
      if (session.user) session.user.role = token.role as string
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
