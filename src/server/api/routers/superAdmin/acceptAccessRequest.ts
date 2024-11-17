import { sendEmail } from 'server/email'
import { accessRequestWasAcceptedTemplate } from 'server/emailTemplate/accessRequestWasAccepted'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const acceptAccessRequest = superAdminProcedure
  .input(
    z.object({
      accessRequestId: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { accessRequestId } = input

    const accessRequest = await prisma.accessRequest.update({
      where: {
        id: accessRequestId,
      },
      data: {
        isAccepted: true,
      },
    })

    await prisma.user.create({
      data: {
        email: accessRequest.email,
        fullName: accessRequest.fullName,
      },
    })

    await sendEmail({
      template: accessRequestWasAcceptedTemplate,
      to: accessRequest.email,
      message: {
        fullName: accessRequest.fullName,
      },
      subject: 'Your request to access Ethnote have been accepted',
    })

    return accessRequest
  })
