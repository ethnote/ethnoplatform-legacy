import { FC, useCallback, useRef, useState } from 'react'
import { Box, Flex, Tag, Text } from '@chakra-ui/react'
import { Prisma } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import moment from 'moment'
import { AppRouter } from 'server/api/root'
import { createEditor, Descendant, Editor } from 'slate'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'

import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { Avatar, InteractiveText } from 'components'
import { Element, Leaf } from '../common/TextEditorComponents'

type Props = {
  comment: NonNullable<
    NonNullable<inferRouterOutputs<AppRouter>['note']['note']>['comments']
  >[0]
  isReply?: boolean
  onReplyClicked: () => void
  onEditClicked: () => void
  isOwner: boolean
  id: string
  isHighlighted: boolean
  noteHandle?: string | null
  me?: inferRouterOutputs<AppRouter>['me']['me']
  contentJson?: Prisma.JsonValue
}

const defaultContent = [
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
]

const CommentBox: FC<Props> = (p) => {
  const [editor] = useState(() => withMentions(withReact(createEditor())))
  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])

  const utils = api.useContext()
  const deleteComment = api.comment.deleteComment.useMutation({
    onMutate: ({ id }) => {
      // Optimisitic update
      const prevComments = utils.comment.comments.getData({
        handle: p.noteHandle ?? undefined,
      })

      utils.comment.comments.setData({ handle: p.noteHandle ?? undefined }, [
        ...((prevComments || []) as any).filter((c: any) => c.id !== id),
      ])
    },
  })
  const { confirm } = useConfirm()

  const initialContent = useRef<Descendant[]>(
    (p.contentJson as any)?.length ? (p.contentJson as any) : defaultContent,
  ).current

  const canEdit = p.comment.author?.id === p.me?.id
  const canDelete = p.comment.author?.id === p.me?.id || p.isOwner

  const onDeleteClicked = () => {
    if (!p.comment.id) return
    confirm({
      title: 'Delete comment',
      isDanger: true,
      message: 'Are you sure you want to delete this comment?',
      onConfirm: () => {
        deleteComment.mutateAsync(
          {
            id: p.comment.id,
          },
          {
            onSettled: () => {
              utils.comment.comments.invalidate()
              utils.note.note.invalidate()
            },
          },
        )
      },
    })
  }

  const isNew = moment(p.comment.createdAt).isAfter(
    moment().subtract(5, 'minutes'),
  )

  return (
    <Box
      mb={p.isHighlighted ? 8 : 4}
      id={p.id}
      outline={p.isHighlighted ? '1px solid' : undefined}
      outlineOffset={8}
      outlineColor='blue.500'
      borderRadius={1}
    >
      <Flex gap={3}>
        <Avatar
          name={p.comment.author?.fullName}
          hue={p.comment.author?.avatarHue}
        />
        <Box
          pr={{
            base: 0,
            md: 8,
          }}
        >
          <Flex
            alignItems={{
              base: 'flex-start',
              md: 'center',
            }}
            flexDir={{
              base: 'column',
              md: 'row',
            }}
          >
            <Text mr={2} fontFamily='Outfit Bold'>
              {p.comment.author?.fullName}
            </Text>
            <Flex
              gap={2}
              mb={{
                base: 1,
                md: 0,
              }}
            >
              {p.comment.isEdited && <Tag size='sm'>Edited</Tag>}
              {isNew && (
                <Tag size='sm' colorScheme='green'>
                  New
                </Tag>
              )}
              <Text opacity={0.5} fontSize='sm'>
                {moment(p.comment.createdAt).fromNow()}
              </Text>
            </Flex>
          </Flex>
          <Slate editor={editor as ReactEditor} value={initialContent}>
            <Box mt={0.5} w='100%'>
              <Editable
                readOnly
                style={{
                  minHeight: '0px',
                }}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
              />
            </Box>
          </Slate>

          <Flex gap={3} mt={0.5}>
            <InteractiveText onClick={p.onReplyClicked} fontSize='sm'>
              Reply
            </InteractiveText>
            {canEdit && (
              <InteractiveText onClick={p.onEditClicked} fontSize='sm'>
                Edit
              </InteractiveText>
            )}
            {canDelete && (
              <InteractiveText onClick={onDeleteClicked} fontSize='sm'>
                Delete
              </InteractiveText>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}

export default CommentBox

const withMentions = (editor: Editor) => {
  const { isInline, isVoid, markableVoid } = editor

  editor.isInline = (element: any) => {
    return element.type === 'comment-mention' ? true : isInline(element)
  }

  editor.isVoid = (element: any) => {
    return element.type === 'comment-mention' ? true : isVoid(element)
  }

  editor.markableVoid = (element: any) => {
    return element.type === 'comment-mention' || markableVoid(element)
  }

  return editor
}
