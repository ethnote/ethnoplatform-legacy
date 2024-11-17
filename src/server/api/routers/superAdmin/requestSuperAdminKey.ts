import moment from 'moment'
import { nanoid } from 'nanoid'
import { sendEmail } from 'server/email'
import { otpTemplate } from 'server/emailTemplate/otp'

import { superAdminProcedure } from '../../trpc'

export const requestSuperAdminKey = superAdminProcedure.mutation(
  async ({ ctx }) => {
    const { prisma, session } = ctx
    const otp = nanoid(16)

    await prisma.superAdminKeyOtp.upsert({
      where: {
        superAdmninUserId: session.user.id,
      },
      create: {
        superAdmninUserId: session.user.id,
        otp,
        otpExpiresAt: moment().add(10, 'minutes').toDate(),
        otpAttempts: 0,
      },
      update: {
        superAdmninUserId: session.user.id,
        otp,
        otpExpiresAt: moment().add(10, 'minutes').toDate(),
        otpAttempts: 0,
      },
    })

    await sendEmail({
      template: otpTemplate,
      message: {
        otp,
      },
      to: 'Ethnote <app@ethnote.org>',
      subject: 'Super Admin Verification Code',
    })

    return { ok: true }
  },
)
