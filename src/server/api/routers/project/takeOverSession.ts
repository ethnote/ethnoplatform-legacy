import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const takeOverTemplateSession = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      templateLockId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const project = await ctx.prisma.project.findFirst({
      where: {
        projectMemberships: {
          some: {
            user: {
              id: ctx.session.user.id,
            },
            projectRole: {
              in: ['PROJECT_OWNER'],
            },
          },
        },
      },
    })

    if (!project) {
      throw new Error('Not authorized')
    }

    await ctx.prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        updatedAt: new Date(),
        templateLockId: input.templateLockId,
        templateLockedAt: new Date(),
        templateLockedByUserId: ctx.session.user.id,
      },
    })

    return true
  })
