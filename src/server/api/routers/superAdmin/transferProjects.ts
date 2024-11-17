import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'
import { transferAllProjects } from '../me/acceptTransferAllProjects'

export const transferProjects = superAdminProcedure
  .input(
    z.object({
      fromEmail: z.string(),
      toEmail: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { fromEmail, toEmail } = input
    const { prisma } = ctx

    const fromUser = await prisma.user.findUnique({
      where: {
        email: fromEmail,
      },
    })

    if (!fromUser) {
      throw new Error(`User with email ${fromEmail} not found`)
    }

    const toUser = await prisma.user.findUnique({
      where: {
        email: toEmail,
      },
    })

    if (!toUser) {
      throw new Error(`User with email ${toEmail} not found`)
    }

    await transferAllProjects({
      fromUserId: fromUser.id,
      toUserId: toUser.id,
      prisma,
    })

    return {
      fromEmail,
      toEmail,
    }
  })
