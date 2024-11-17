import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateFile = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      caption: z.string().max(255).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const file = await ctx.prisma.file.findFirst({
      where: {
        id: input.id,
      },
      include: {
        note: true,
      },
    })

    if (!file) {
      throw new Error('Not authorized')
    }

    const note = await ctx.prisma.note.findFirst({
      where: {
        OR: [
          {
            id: file?.noteId,
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
            id: file?.noteId,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const updatedNote = await ctx.prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        name: input.name,
        caption: input.caption,
      },
    })

    return updatedNote
  })
