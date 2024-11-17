import { protectedProcedure } from '../../trpc'

export const cancelTransferAllProjects = protectedProcedure.mutation(
  async ({ ctx }) => {
    const projectTransferInvitations =
      await ctx.prisma.projectTransferInvitation.findMany({
        where: {
          fromUserId: ctx.session.user.id,
        },
      })

    if (!projectTransferInvitations.length) {
      throw new Error(
        'You do not have any pending project transfer invitations',
      )
    }

    for (const projectTransferInvitation of projectTransferInvitations) {
      await ctx.prisma.projectTransferInvitation.delete({
        where: {
          id: projectTransferInvitation.id,
        },
      })
    }

    return true
  },
)
