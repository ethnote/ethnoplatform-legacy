import { type GetServerSidePropsContext } from 'next'
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from 'server/db'

import { createDemoProject } from './createDemoProject'

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        otp: { label: 'Otp', type: 'text', placeholder: '0000' },
      },
      async authorize(credentials) {
        const { email: rawEmail, otp } = credentials || {}

        const email = rawEmail?.toLowerCase()

        if (!email || !otp) {
          throw new Error('Invalid credentials')
        }

        const validOtp = await prisma.otp.findFirst({
          where: {
            email,
            otp: +otp,
          },
        })

        if (!validOtp) {
          throw new Error('Invalid verification code')
        }

        await prisma.otp.delete({
          where: {
            id: validOtp.id,
          },
        })

        const user = await prisma.user.findFirst({
          where: {
            email,
          },
        })

        if (user) {
          return user
        }

        const newUser = await prisma.user.create({
          data: {
            email,
          },
        })

        await createDemoProject(newUser.id)

        return newUser
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
    verifyRequest: '/verify-request',
  },
  secret: process.env.NEXT_SECRET,
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req']
  res: GetServerSidePropsContext['res']
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions)
}
