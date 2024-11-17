import { newCommentNotification } from 'server/api/notifications/newCommentNotification'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const createComment = protectedProcedure
  .input(
    z.object({
      noteId: z.string(),
      content: z.string(),
      isReplyToId: z.string().optional(),
      contentJson: z.any(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx
    const { noteId, content, isReplyToId, contentJson } = input

    const comment = await prisma.comment.create({
      data: {
        content,
        noteId,
        authorId: session.user.id,
        isReplyToId,
        contentJson,
      },
    })

    await newCommentNotification({
      commentId: comment.id,
      commentAuthorId: session.user.id,
      noteId,
      isReplyToCommentId: isReplyToId,
    })

    return comment
  })
