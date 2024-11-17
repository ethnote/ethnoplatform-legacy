import { NotificationType } from '@prisma/client'
import { env } from 'env.mjs'
import { prisma } from 'server/db'
import { sendEmail } from 'server/email'
import { commentOnYourNote } from 'server/emailTemplate/comment'
import { commentReply } from 'server/emailTemplate/commentReply'
import { publishMessage } from 'server/realtime/publishMessage'

import { getCommentMentions } from 'utils/slate'
import { MentionElement } from 'components/comments/CommentWriteArea'

/**
 * Sends a notification to the note author when someone comments on their note
 * Sends a notification to the comment author when someone replies to their comment
 * Send notifications to tagged users
 */

export const newCommentNotification = async ({
  commentId,
  commentAuthorId,
  noteId,
  isReplyToCommentId,
}: {
  commentId: string
  commentAuthorId: string
  noteId: string
  isReplyToCommentId?: string
}) => {
  await publishMessage(`comments-${noteId}`, {
    newMessage: true,
  })

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
  })

  const uniqueCommentMentions = getCommentMentions(comment?.contentJson).reduce(
    (acc, curr) => {
      if (!acc.some((mention) => mention.mentionId === curr.mentionId)) {
        if (curr.mentionId !== commentAuthorId) {
          acc.push(curr)
        }
      }
      return acc
    },
    [] as MentionElement[],
  )

  const replyToComment = isReplyToCommentId
    ? await prisma.comment.findUnique({
        where: {
          id: isReplyToCommentId,
        },
        include: {
          author: true,
        },
      })
    : null

  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
    include: {
      author: true,
      project: true,
    },
  })

  const commentAuthor = await prisma.user.findUnique({
    where: {
      id: commentAuthorId,
    },
  })

  const commentAuthorName = commentAuthor?.fullName || commentAuthor?.email

  const isReplyToCommment = isReplyToCommentId
    ? await prisma.comment.findFirst({
        where: {
          id: isReplyToCommentId,
        },
      })
    : null

  for (let i = 0; i < uniqueCommentMentions.length; i++) {
    const commentMention = uniqueCommentMentions[i]
    if (!note || !commentMention) continue

    const notification = await prisma.notification.create({
      data: {
        userId: commentMention.mentionId,
        type: NotificationType.NoteCommentMention,
        noteId: note.id,
        projectId: note.projectId,
        commentId: comment?.id,
      },
    })

    await publishMessage(`notification-${commentMention.mentionId}`, {
      showNotification: true,
      notificationId: notification.id,
      message: `${commentAuthorName} mentioned you in ${note?.title}`,
    })

    await sendEmail({
      template: commentOnYourNote,
      message: {
        commentAuthorName,
        comment: comment?.content,
        replyLink: `${env.NEXTAUTH_URL}/projects/${note?.project?.handle}/notes/${note?.handle}?comment=${comment?.id}`,
      },
      to: commentMention.mentionEmail,
      subject: `${commentAuthorName} mentioned you in ${note?.title}`,
    })
  }

  if (
    comment?.authorId !== note?.authorId &&
    !uniqueCommentMentions.some((m) => m.mentionId === note?.authorId)
  ) {
    if (
      note?.author?.email &&
      comment?.id &&
      !isReplyToCommment &&
      note.authorId
    ) {
      // Send email that someone commented on your note
      const notification = await prisma.notification.create({
        data: {
          userId: note.authorId,
          type: NotificationType.NoteComment,
          noteId: note.id,
          projectId: note.projectId,
          commentId: comment?.id,
        },
      })

      await publishMessage(`notification-${note.author.id}`, {
        showNotification: true,
        notificationId: notification.id,
        message: `${commentAuthorName} commented on your note ${note?.title}`,
      })

      await sendEmail({
        template: commentOnYourNote,
        message: {
          commentAuthorName,
          comment: comment?.content,
          replyLink: `${env.NEXTAUTH_URL}/projects/${note?.project?.handle}/notes/${note?.handle}?comment=${comment?.id}`,
        },
        to: note.author.email,
        subject: `${commentAuthorName} commented on your note ${note?.title}`,
      })
    }
  }

  if (isReplyToCommment) {
    if (commentAuthorId === replyToComment?.authorId) {
      return // Commenting it's own comment
    } else {
      if (
        !uniqueCommentMentions.some(
          (m) => m.mentionId === replyToComment?.authorId,
        )
      )
        return // Already notified the note author
      if (
        replyToComment?.authorId &&
        replyToComment?.author &&
        comment?.id &&
        note?.id &&
        replyToComment.author.email
      ) {
        // Send email that someone replied to your comment
        const notification = await prisma.notification.create({
          data: {
            userId: replyToComment?.authorId,
            type: NotificationType.NoteCommentReply,
            noteId: note.id,
            projectId: note.projectId,
            commentId: comment?.id,
          },
        })

        await publishMessage(`notification-${replyToComment.author.id}`, {
          showNotification: true,
          notificationId: notification.id,
          message: `${commentAuthorName} replied to your comment`,
        })

        await sendEmail({
          template: commentReply,
          message: {
            commentAuthorName,
            comment: comment?.content,
            replyLink: `${env.NEXTAUTH_URL}/projects/${note?.project?.handle}/notes/${note?.handle}?comment=${comment?.id}`,
          },
          to: replyToComment.author.email,
          subject: `${commentAuthorName} replied to your comment`,
        })
      }
    }
  }
}
