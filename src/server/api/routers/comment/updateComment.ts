import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateComment = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      content: z.string(),
      contentJson: z.any(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx
    const { id, content, contentJson } = input

    const comment = await prisma.comment.findUnique({
      where: {
        id,
      },
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    if (comment.authorId !== session.user.id) {
      throw new Error('You are not the author of this comment')
    }

    const updatedComment = await prisma.comment.update({
      where: {
        id,
      },
      data: {
        content,
        authorId: session.user.id,
        isEdited: true,
        contentJson,
      },
    })

    return updatedComment
  })
