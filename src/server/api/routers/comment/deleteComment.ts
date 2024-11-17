import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const deleteComment = protectedProcedure
  .input(
    z.object({
      id: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { id } = input

    const comment = await prisma.comment.findFirst({
      where: {
        OR: [
          {
            id,
            note: {
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
          },
          {
            id,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    const deletedComment = await prisma.comment.delete({
      where: {
        id,
      },
    })

    return deletedComment
  })
