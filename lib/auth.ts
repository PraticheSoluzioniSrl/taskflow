import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createOrUpdateUser } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Usa account?.providerAccountId o user.email come ID se user.id non è disponibile
      const userId = user.id || account?.providerAccountId || user.email;
      await createOrUpdateUser(userId, user.email, user.name || undefined, user.image || undefined);
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
})
