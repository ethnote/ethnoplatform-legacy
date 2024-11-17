import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateNote = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      isVisible: z.boolean().optional(),
      title: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const note = await ctx.prisma.note.findFirst({
      where: {
        OR: [
          {
            id: input.id,
            project: {
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
          },
          {
            id: input.id,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const updateNote = await ctx.prisma.note.update({
      where: {
        id: note.id,
      },
      data: {
        isVisible: input.isVisible,
        title: input.title,
      },
    })

    await ctx.prisma.project.update({
      where: {
        id: note.projectId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return updateNote
  })
