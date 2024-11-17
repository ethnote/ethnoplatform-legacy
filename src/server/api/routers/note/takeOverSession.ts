import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const takeOverSession = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      lockId: z.string(),
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

    await ctx.prisma.note.update({
      where: {
        id: note.id,
      },
      data: {
        updatedAt: new Date(),
        lockId: input.lockId,
        lockedAt: new Date(),
        lockedByUserId: ctx.session.user.id,
      },
    })

    return true
  })
