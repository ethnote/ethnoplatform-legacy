import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Center, Text } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { usePubNub } from 'hooks/usePubNub'
import { CommentBox, CommentWriteArea } from 'components'

type Props = {
  note?: inferRouterOutputs<AppRouter>['note']['note']
  isOwner: boolean
}

const CommentArea: FC<Props> = (p) => {
  const { query } = useRouter()
  const [editId, setEditId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [initialReply, setInitialReply] = useState<Record<string, any>[]>([])

  const { data: me } = api.me.me.useQuery()

  const { data: comments, refetch } = api.comment.comments.useQuery(
    {
      handle: p.note?.handle ?? undefined,
    },
    {
      enabled: !!p.note?.handle,
    },
  ) || { data: [] }

  const { data: project } = api.project.project.useQuery({
    handle: query.projectHandle as string,
  })

  const members = project?.projectMemberships
    ?.map((m) => {
      return {
        userId: m.user?.id,
        name: m.user?.fullName,
        email: m.user?.email || m.invitationMailSentTo,
        invitationAcceptedAt: m.invitationAcceptedAt,
      }
    })
    .filter((m) => m.invitationAcceptedAt)

  useEffect(() => {
    const replyToComment = comments?.find((c) => c.id === replyingToId)
    const author = members?.find((m) => m.userId === replyToComment?.author?.id)
    if (!author) return

    const reply = initalReplyContent({
      name: author.name,
      email: author.email,
      userId: author.userId,
    })
    setInitialReply(reply)
  }, [replyingToId])

  const router = useRouter()
  const { comment: commentId } = router.query
  const [highlightedComment, setHighlightedComment] = useState<string>()
  const { listen } = usePubNub()

  useEffect(() => {
    if (!p.note?.id) return
    const unsubscribe = listen(`comments-${p.note.id}`, () => {
      refetch()
    })
    return () => {
      unsubscribe()
    }
  }, [p.note?.id])

  useEffect(() => {
    if (!commentId || highlightedComment) return
    const comment = comments?.find((c) => c.id === commentId)
    if (!comment) return
    setReplyingToId(commentId as string)
    setHighlightedComment(commentId as string)

    // scroll to comment
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [commentId, comments])

  const initalReplyContent = ({
    name,
    email,
    userId,
  }: {
    name?: string | null
    email?: string | null
    userId?: string | null
  }) => [
    {
      type: 'paragraph',
      children: [
        { text: '' },
        {
          type: 'comment-mention',
          mention: name || email || '',
          children: [{ text: `@${name || email || ''}` }],
          mentionId: userId,
          mentionName: name,
          mentionEmail: email,
        },
        { text: ' ' },
      ],
    },
  ]

  return (
    <Box>
      {comments?.length ? (
        comments
          .filter((c) => !c.isReplyToId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((comment) => {
            const replies = comments.filter((c) => c.isReplyToId === comment.id)

            return (
              <Box mb={6} key={comment.id}>
                {editId !== comment.id ? (
                  <CommentBox
                    key={comment.id}
                    comment={comment}
                    onEditClicked={() => setEditId(comment.id)}
                    onReplyClicked={() => setReplyingToId(comment.id)}
                    isOwner={p.isOwner}
                    id={`comment-${comment.id}`}
                    isHighlighted={highlightedComment === comment.id}
                    noteHandle={p.note?.handle}
                    contentJson={comment.contentJson}
                    me={me}
                  />
                ) : (
                  p.note?.id && (
                    <CommentWriteArea
                      key={comment.id + 'comment'}
                      noteId={p.note?.id}
                      initalContent={comment.contentJson}
                      commentId={comment.id}
                      onCancelEditClicked={() => setEditId(null)}
                      noteHandle={p.note?.handle}
                      members={members}
                      me={me}
                    />
                  )
                )}
                <Box ml={7}>
                  {replies.length ? (
                    <>
                      {replies
                        .sort(
                          (a, b) =>
                            a.createdAt.getTime() - b.createdAt.getTime(),
                        )
                        .map((reply) => (
                          <>
                            {editId !== reply.id ? (
                              <CommentBox
                                key={reply.id}
                                comment={reply}
                                onEditClicked={() => setEditId(reply.id)}
                                onReplyClicked={() =>
                                  setReplyingToId(comment.id)
                                }
                                isOwner={p.isOwner}
                                id={`comment-${reply.id}`}
                                isHighlighted={highlightedComment === reply.id}
                                noteHandle={p.note?.handle}
                                contentJson={reply.contentJson}
                                me={me}
                              />
                            ) : (
                              p.note?.id &&
                              initialReply && (
                                <CommentWriteArea
                                  key={reply.id + 'reply'}
                                  noteId={p.note?.id}
                                  initalContent={reply.contentJson}
                                  commentId={reply.id}
                                  onCancelEditClicked={() => setEditId(null)}
                                  noteHandle={p.note?.handle}
                                  members={members}
                                  me={me}
                                />
                              )
                            )}
                          </>
                        ))}
                    </>
                  ) : (
                    <></>
                  )}
                  {replyingToId &&
                    initialReply &&
                    [comment.id, ...replies.map((r) => r.id)].includes(
                      replyingToId,
                    ) && (
                      <CommentWriteArea
                        key={replyingToId + 'reply'}
                        noteId={p.note?.id}
                        onCancelReplyClicked={() => setReplyingToId(null)}
                        onCancelEditClicked={() => setEditId(null)}
                        replyingToId={replyingToId}
                        noteHandle={p.note?.handle}
                        members={members}
                        initalContent={initialReply}
                        me={me}
                      />
                    )}
                </Box>
              </Box>
            )
          })
      ) : (
        <Center p={4}>
          <Text opacity={0.5}>No comments added yet</Text>
        </Center>
      )}
      <CommentWriteArea
        key={p.note?.id + 'write'}
        noteId={p.note?.id}
        noteHandle={p.note?.handle}
        members={members}
        me={me}
      />
    </Box>
  )
}

export default CommentArea
