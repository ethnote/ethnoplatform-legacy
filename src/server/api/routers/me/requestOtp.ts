import moment from 'moment'
import { sendEmail } from 'server/email'
import { otpTemplate } from 'server/emailTemplate/otp'
import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const requestOtp = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const newOtp = Math.floor(100000 + Math.random() * 899999)

    // Check if user can access
    const existingUser = await ctx.prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase(),
      },
    })

    const accessRequest = await ctx.prisma.accessRequest.findFirst({
      where: {
        email: input.email.toLowerCase(),
        isAccepted: true,
      },
    })

    const projectMembership = await ctx.prisma.projectMembership.findFirst({
      where: {
        invitationMailSentTo: input.email.toLowerCase(),
      },
    })

    const userCount = await ctx.prisma.user.count()

    if (
      !existingUser &&
      !accessRequest &&
      !projectMembership &&
      userCount !== 0
    ) {
      throw new Error('User does not have access')
    }

    const otp = await ctx.prisma.otp.upsert({
      where: {
        email: input.email.toLowerCase(),
      },
      create: {
        email: input.email.toLowerCase(),
        otp: newOtp,
        otpExpiresAt: moment().add(10, 'minutes').toDate(),
        otpAttempts: 0,
      },
      update: {
        email: input.email.toLowerCase(),
        otp: newOtp,
        otpExpiresAt: moment().add(10, 'minutes').toDate(),
        otpAttempts: 0,
      },
    })

    console.log('otp', otp.otp)

    await sendEmail({
      template: otpTemplate,
      message: {
        otp: newOtp,
      },
      to: input.email.toLowerCase(),
      subject: 'Sign into Ethnote',
    })

    return { ok: true }
  })
