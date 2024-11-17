import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const requestTransferAllProjects = protectedProcedure
  .input(
    z.object({
      toEmail: z.string().email(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { toEmail } = input

    const existingProjectTransferInvitation =
      await ctx.prisma.projectTransferInvitation.findFirst({
        where: {
          fromUserId: ctx.session.user.id,
        },
      })

    if (existingProjectTransferInvitation) {
      throw new Error('You already have a pending project transfer invitation')
    }

    const projectTransferInvitation =
      await ctx.prisma.projectTransferInvitation.create({
        data: {
          fromUserId: ctx.session.user.id,
          toEmail: toEmail.toLowerCase(),
        },
      })

    return projectTransferInvitation
  })
