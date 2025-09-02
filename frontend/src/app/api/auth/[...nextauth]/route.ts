import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001')

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })

          const data = await res.json()

          if (res.ok && data.user) {
            return {
              ...data.user,
              token: data.accessToken
            }
          }
          return null
        } catch (error) {
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          accessToken: user.token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: user.token
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        token: token.accessToken as string,
        user: token.user as {
          id: string
          name: string
          email: string
          role: string
          token?: string
        }
      }
    }
  },
  pages: {
    signIn: '/rachell-admin/login',
  },
  session: {
    strategy: 'jwt',
  }
})

export { handler as GET, handler as POST } 

async function refreshAccessToken(token: any) {
  try {
    // ... código ...
  } catch (_error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
} 