import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const deleteNotes = protectedProcedure
  .input(
    z.object({
      ids: z.array(z.string()),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    input.ids.forEach(async (id) => {
      const note = await ctx.prisma.note.findFirst({
        where: {
          OR: [
            {
              id,
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
              id,
              authorId: ctx.session.user.id,
            },
          ],
        },
      })

      if (!note) {
        throw new Error('Not authorized')
      }

      await ctx.prisma.note.delete({
        where: {
          id: note.id,
        },
      })

      // TODO: Delete files
    })
  })
