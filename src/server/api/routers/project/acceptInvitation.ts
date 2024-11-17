import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const acceptInvitation = protectedProcedure
  .input(
    z.object({
      membershipToAccept: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const membership = await ctx.prisma.projectMembership.findFirst({
      where: {
        id: input.membershipToAccept,
        invitationMailSentTo: ctx.session.user.email,
        invitationAcceptedAt: null,
      },
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    const updatedMembership = await ctx.prisma.projectMembership.update({
      where: {
        id: membership.id,
      },
      data: {
        invitationAcceptedAt: new Date(),
        user: {
          connect: {
            id: ctx.session.user.id,
          },
        },
      },
    })

    return updatedMembership
  })
