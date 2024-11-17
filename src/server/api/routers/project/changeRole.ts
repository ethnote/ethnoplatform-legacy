import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const changeRole = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      membershipToChangeRole: z.string(),
      changeRoleTo: z.enum(['PROJECT_OWNER', 'MEMBER']),
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

    const updatedMembership = await ctx.prisma.projectMembership.update({
      where: {
        id: input.membershipToChangeRole,
      },
      data: {
        projectRole: input.changeRoleTo,
      },
    })

    return updatedMembership
  })
