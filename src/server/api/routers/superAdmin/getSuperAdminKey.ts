import { env } from 'env.mjs'
import jsonwebtoken from 'jsonwebtoken'
import moment from 'moment'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const getSuperAdminKey = superAdminProcedure
  .input(
    z.object({
      otp: z.string().min(16).max(16),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx
    const { otp } = input

    const otpByUserId = await prisma.superAdminKeyOtp.findFirst({
      where: {
        superAdmninUserId: session.user.id,
      },
    })

    if (!otpByUserId || !otpByUserId.otpExpiresAt) {
      throw new Error('Invalid verification code')
    }

    const isExpired = moment(otpByUserId.otpExpiresAt).isBefore(moment())

    if (isExpired) {
      throw new Error('Verification code expired')
    }

    if (otpByUserId.otpAttempts >= 3) {
      throw new Error('Too many attempts')
    }

    const isValid = otpByUserId.otp === otp

    if (!isValid) {
      // Update the number of attempts
      await prisma.superAdminKeyOtp.update({
        where: {
          id: otpByUserId.id,
        },
        data: {
          otpAttempts: otpByUserId.otpAttempts + 1,
        },
      })

      throw new Error('Invalid verification code')
    }

    const jwt = jsonwebtoken.sign(
      {
        superAdmninUserId: session.user.id,
      },
      env.SUPER_ADMIN_KEY_SECRET,
      {
        expiresIn: '12h',
      },
    )

    return {
      jwt,
    }
  })
