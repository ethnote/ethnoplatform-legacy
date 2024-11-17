import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const leaveProject = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
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
          },
        },
      },
    })

    if (!project) {
      throw new Error('Not member of project')
    }

    const projectMembership = await ctx.prisma.projectMembership.findFirst({
      where: {
        projectId: project.id,
        userId: ctx.session.user.id,
      },
    })

    const isOnlyOwner =
      projectMembership?.projectRole === 'PROJECT_OWNER' &&
      (await ctx.prisma.projectMembership.count({
        where: {
          projectId: project.id,
          projectRole: 'PROJECT_OWNER',
        },
      })) === 1

    if (isOnlyOwner) {
      throw new Error('Cannot leave project as only owner')
    }

    const deletedProjectMembership = await ctx.prisma.projectMembership.delete({
      where: {
        id: projectMembership?.id,
      },
    })

    return deletedProjectMembership
  })
