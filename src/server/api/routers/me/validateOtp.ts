import moment from 'moment'
import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const validateOtp = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      otp: z.string().min(6).max(6),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const email = input.email.toLowerCase()

    const otpByEmail = await ctx.prisma.otp.findFirst({
      where: {
        email,
      },
    })

    if (!otpByEmail || !otpByEmail.otpExpiresAt) {
      throw new Error('Invalid verification code')
    }

    const isExpired = moment(otpByEmail.otpExpiresAt).isBefore(moment())

    if (isExpired) {
      throw new Error('Verification code expired')
    }

    if (otpByEmail.otpAttempts >= 3) {
      throw new Error('Too many attempts')
    }

    const isValid = otpByEmail.otp === +input.otp

    if (!isValid) {
      // Update the number of attempts
      await ctx.prisma.otp.update({
        where: {
          id: otpByEmail.id,
        },
        data: {
          otpAttempts: otpByEmail.otpAttempts + 1,
        },
      })

      throw new Error('Invalid verification code')
    }

    return { ok: true }
  })
