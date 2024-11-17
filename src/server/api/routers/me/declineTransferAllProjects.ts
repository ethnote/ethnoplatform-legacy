import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const declineTransferAllProjects = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { id } = input

    if (!ctx.session.user.email) {
      throw new Error('User email not found')
    }

    const projectTransferInvitation =
      await ctx.prisma.projectTransferInvitation.findFirst({
        where: {
          id,
          toEmail: ctx.session.user.email,
        },
      })

    if (!projectTransferInvitation) {
      throw new Error('This project transfer invitation does not exist')
    }

    const deletedProjectTransferInvitation =
      await ctx.prisma.projectTransferInvitation.delete({
        where: {
          id: projectTransferInvitation.id,
        },
      })

    return deletedProjectTransferInvitation
  })
