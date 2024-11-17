import { sendEmail } from 'server/email'
import { genericTemplate } from 'server/emailTemplate/generic'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const sendEmailToAllUsers = superAdminProcedure
  .input(
    z.object({
      subject: z.string(),
      body: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { subject, body } = input

    const allUsers = (
      await prisma.user.findMany({
        select: {
          email: true,
        },
      })
    ).filter((user) => !!user.email) as { email: string }[]

    let mailCount = 0

    for (const user of allUsers) {
      try {
        await sendEmail({
          template: genericTemplate,
          message: {
            subject,
            body,
          },
          to: user.email.toLowerCase(),
          subject,
        })
        mailCount++
      } catch (e) {
        console.log(e)
      }
    }

    return { mailCount }
  })
