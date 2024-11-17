import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const removeMember = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      membershipToRemove: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const project = await ctx.prisma.project.findFirst({
      where: {
        handle: input.projectHandle,
        projectMemberships: {
          some: {
            user: {
              id: ctx.session.user.id, // Check if user is a member of the project
            },
            projectRole: {
              in: ['PROJECT_OWNER'], // Check if user is a project owner
            },
          },
        },
      },
    })

    if (!project) {
      throw new Error('Not authorized')
    }

    const mebership = await ctx.prisma.projectMembership.findFirst({
      where: {
        id: input.membershipToRemove,
        project: {
          id: project.id,
        },
      },
    })

    if (!mebership) {
      throw new Error('Membership not found')
    }

    if (mebership.userId === ctx.session.user.id) {
      throw new Error('You cannot remove yourself from the project')
    }

    const membership = await ctx.prisma.projectMembership.delete({
      where: {
        id: mebership.id,
      },
    })

    return membership
  })
