import { sendEmail } from 'server/email'
import { genericTemplate } from 'server/emailTemplate/generic'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const supportMessage = protectedProcedure
  .input(
    z.object({
      body: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { email } = ctx.session.user
    const { body } = input

    try {
      await sendEmail({
        template: genericTemplate,
        message: {
          subject: `Support message from ${email}`,
          body,
        },
        to: 'Ethnote <app@ethnote.org>',
        subject: `Support message from ${email}`,
      })
    } catch (e) {
      console.log(e)
    }

    return { ok: true }
  })
