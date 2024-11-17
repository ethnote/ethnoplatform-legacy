import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const declineInvitation = protectedProcedure
  .input(
    z.object({
      membershipToDecline: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const membership = await ctx.prisma.projectMembership.findFirst({
      where: {
        id: input.membershipToDecline,
        invitationMailSentTo: ctx.session.user.email,
        invitationAcceptedAt: null,
      },
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    const declinedMembership = await ctx.prisma.projectMembership.delete({
      where: {
        id: membership.id,
      },
    })

    return declinedMembership
  })
