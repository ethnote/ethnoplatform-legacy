import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { Prisma } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import { BORDER_RADIUS } from 'constants/constants'
import ReactDOM from 'react-dom'
import { AppRouter } from 'server/api/root'
import {
  createEditor,
  Descendant,
  Editor,
  Node,
  Range,
  Transforms,
} from 'slate'
import { withHistory } from 'slate-history'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'

import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import { Avatar } from 'components'
import { Element, Leaf } from '../common/TextEditorComponents'

type Props = {
  noteId?: string
  commentId?: string
  // initalValue?: string | null
  onCancelReplyClicked?: () => void
  onCancelEditClicked?: () => void
  replyingToId?: string | null
  noteHandle?: string | null
  members?: {
    userId?: string | null
    name?: string | null
    email?: string | null
    invitationAcceptedAt?: Date | null
  }[]
  initalContent?: Prisma.JsonValue
  me?: inferRouterOutputs<AppRouter>['me']['me']
}

export const defaultContent = [
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
]

const CommentWriteArea: FC<Props> = (p) => {
  // const [comment, setComment] = useState(p.initalValue || '')
  const { bg } = useStyle()

  // Mention team memers
  const [target, setTarget] = useState<Range | undefined | null>()
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState<string | undefined>('')

  const [localContent, setLocalContent] = useState<Descendant[]>([])

  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])
  const [editor] = useState(() =>
    withMentions(withHistory(withReact(createEditor()))),
  )
  const ref = useRef<HTMLDivElement | null>(null)

  const initialContent = useRef<Descendant[]>(
    (p.initalContent as any)?.length
      ? (p.initalContent as any)
      : defaultContent,
  ).current

  useEffect(() => {
    // Set focus after last word
    Transforms.select(editor, {
      anchor: Editor.end(editor, []),
      focus: Editor.end(editor, []),
    })
  }, [p.initalContent])

  const utils = api.useContext()

  const addComment = api.comment.createComment.useMutation({
    onMutate: (newComment) => {
      // Optimistically update the comments
      const prevComments = utils.comment.comments.getData({
        handle: p.noteHandle ?? undefined,
      })
      utils.comment.comments.setData({ handle: p.noteHandle ?? undefined }, [
        ...((prevComments || []) as any),
        {
          ...newComment,
          id: 'optimistic',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: p.me,
        },
      ])
      p.onCancelReplyClicked?.()
      p.onCancelEditClicked?.()
    },
  })

  const chars =
    p.members
      ?.filter(
        (m) =>
          search &&
          (m?.name || m?.email || '')
            .toLowerCase()
            .startsWith(search.toLowerCase()),
      )
      .slice(0, 10) || []

  useEffect(() => {
    if (target) {
      const el = ref.current
      if (!el) return
      const domRange = ReactEditor.toDOMRange(
        editor as ReactEditor,
        target as any,
      )
      const rect = domRange.getBoundingClientRect()
      el.style.top = `${rect.top + window.pageYOffset + 24}px`
      el.style.left = `${rect.left + window.pageXOffset}px`
    }
  }, [chars.length, editor, index, search, target])

  const updateComment = api.comment.updateComment.useMutation({
    onMutate: (newComment) => {
      // Optimistically update the comments
      const prevComments = utils.comment.comments.getData({
        handle: p.noteHandle ?? undefined,
      })
      utils.comment.comments.setData({ handle: p.noteHandle ?? undefined }, [
        ...((prevComments || []) as any).map((c: any) =>
          c.id === p.commentId
            ? {
                ...c,
                ...newComment,
                isEdited: true,
              }
            : c,
        ),
      ])
      p.onCancelReplyClicked?.()
      p.onCancelEditClicked?.()
    },
  })

  const insertMention = (
    editor: Editor,
    mentionId?: string | null,
    mentionEmail?: string | null,
    mentionName?: string | null,
  ) => {
    if (!mentionId || !mentionEmail) return

    const mentionElement: MentionElement = {
      type: 'comment-mention',
      mention: mentionName || mentionEmail,
      children: [{ text: '@' + mentionName || mentionEmail }],
      mentionId,
      mentionName,
      mentionEmail,
    }
    Transforms.insertNodes(editor, mentionElement)
    Transforms.move(editor)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (target) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          const prevIndex = index >= chars.length - 1 ? 0 : index + 1
          setIndex(prevIndex)
          break
        case 'ArrowUp':
          event.preventDefault()
          const nextIndex = index <= 0 ? chars.length - 1 : index - 1
          setIndex(nextIndex)
          break
        case 'Tab':
        case 'Enter':
          event.preventDefault()
          Transforms.select(editor, target as any)
          typeof chars[index]?.userId === 'string' &&
            insertMention(
              editor,
              chars[index]?.userId,
              chars[index]?.email,
              chars[index]?.name,
            )
          setTarget(null)
          break
        case 'Escape':
          event.preventDefault()
          setTarget(null)
          break
      }
    } else {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onSendClicked()
      } else if (event.key === 'Enter' && event.shiftKey) {
        // Insert new line

        Editor.insertText(editor, '\n')
        event.preventDefault()
      } else if (event.key === 'Escape') {
        if (p.onCancelReplyClicked) {
          p.onCancelReplyClicked()
        } else if (p.onCancelEditClicked) {
          p.onCancelEditClicked()
        }
      }
    }
  }

  const onSendClicked = () => {
    if (!localContent.length || !p.noteId) return

    if (p.commentId) {
      updateComment.mutateAsync(
        {
          id: p.commentId,
          content: serialize(localContent),
          contentJson: localContent,
        },
        {
          onSettled: () => {
            utils.note.note.invalidate()
            utils.comment.comments.invalidate()
            p.onCancelEditClicked?.()
          },
        },
      )
    } else {
      addComment.mutateAsync(
        {
          noteId: p.noteId,
          content: serialize(localContent),
          isReplyToId: p.replyingToId ?? undefined,
          contentJson: localContent,
        },
        {
          onSettled: () => {
            utils.note.note.invalidate()
            utils.comment.comments.invalidate()
            p.onCancelReplyClicked?.()
          },
        },
      )
    }
    setLocalContent(defaultContent)
    // Set editor value to default content
    editor.children = defaultContent

    // Reset slate editor
    Transforms.deselect(editor)
    Transforms.select(editor, { offset: 0, path: [0, 0] })
  }

  return (
    <Box>
      <Flex gap={3}>
        <Avatar name={p.me?.fullName} hue={p.me?.avatarHue} />
        <Box
          w='100%'
          pr={{
            base: 0,
            md: 8,
          }}
        >
          <Flex gap={2} alignItems='center'>
            <Text fontFamily='Outfit Bold'>{p.me?.fullName}</Text>
          </Flex>
          <Slate
            editor={editor as ReactEditor}
            value={initialContent}
            onChange={(v) => {
              const { selection } = editor

              if (selection && Range.isCollapsed(selection)) {
                const [start] = Range.edges(selection)
                const wordBefore = Editor.before(editor, start, {
                  unit: 'word',
                })

                const before = wordBefore && Editor.before(editor, wordBefore)
                const beforeRange =
                  before && Editor.range(editor, before, start)
                const beforeText =
                  beforeRange && Editor.string(editor, beforeRange)
                const beforeMatch = beforeText && beforeText.match(/^@?(\w+)?$/)

                const after = Editor.after(editor, start)
                const afterRange = Editor.range(editor, start, after)
                const afterText = Editor.string(editor, afterRange)
                const afterMatch = afterText.match(/^(\s|$)/)

                if (beforeMatch && afterMatch) {
                  setTarget(beforeRange as any)
                  setSearch(beforeMatch[1])
                  setIndex(0)
                  return
                }
              }

              setTarget(null)
              setLocalContent(v)
            }}
          >
            <Box p={3} borderWidth={1} borderRadius={BORDER_RADIUS} mt={2}>
              <Editable
                spellCheck
                style={{
                  minHeight: '80px',
                  maxHeight: '700px',
                  overflow: 'auto',
                }}
                onKeyDown={onKeyDown}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                autoFocus={!!p.commentId || !!p.replyingToId}
                tabIndex={-1}
              />
              {target && chars.length > 0 && (
                <Portal>
                  <Box
                    ref={ref}
                    top='-9999px'
                    left='-9999px'
                    position='absolute'
                    zIndex={1}
                    padding='3px'
                    bg={bg}
                    borderWidth={1}
                    borderRadius='4px'
                    boxShadow='0 1px 5px rgba(0,0,0,.2)'
                    data-cy='mention-portal'
                  >
                    <MentionSuggestions
                      mentions={chars.map((c) => c.name || c.email || '')}
                      onClick={(index) => {
                        Transforms.select(editor, target)
                        insertMention(
                          editor,
                          chars[index]?.userId,
                          chars[index]?.email,
                          chars[index]?.name,
                        )
                        setTarget(null)
                      }}
                      index={index}
                    />
                  </Box>
                </Portal>
              )}
            </Box>
          </Slate>

          <Flex justifyContent='flex-end' gap={2}>
            {(p.onCancelReplyClicked || p.onCancelEditClicked) && (
              <Button
                size='sm'
                onClick={
                  p.replyingToId
                    ? p.onCancelReplyClicked
                    : p.onCancelEditClicked
                }
                mt={2}
              >
                Cancel
              </Button>
            )}
            <Button
              size='sm'
              onClick={onSendClicked}
              isDisabled={!serialize(localContent)}
              colorScheme='blue'
              mt={2}
            >
              {p.commentId ? 'Edit' : 'Send'}
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Box>
  )
}

export default CommentWriteArea

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

export type MentionElement = {
  type: 'comment-mention'
  mention: string
  children: CustomText[]
  mentionId: string
  mentionName?: string | null
  mentionEmail: string
}

export type CustomText = {
  bold?: boolean
  italic?: boolean
  code?: boolean
  text: string
}

export const Portal = ({ children }: { children: ReactNode }) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null
}

type MentionSuggestionsProps = {
  onClick: (index: number) => void
  index: number
  mentions: string[]
}

const MentionSuggestions = (p: MentionSuggestionsProps) => {
  return (
    <Box>
      {p.mentions.map((val, i) => (
        <Flex
          key={val}
          onMouseDown={(e) => {
            e.preventDefault()
            p.onClick(p.index)
          }}
          padding={'1px 3px'}
          borderRadius={'3px'}
          cursor='pointer'
          _hover={{ bg: 'blue.400' }}
          background={i === p.index ? 'blue.500' : 'transparent'}
          p={1}
          px={2}
          gap={2}
        >
          {/* <Avatar size='xs' name={val} /> */}
          {val}
        </Flex>
      ))}
    </Box>
  )
}

const serialize = (nodes: Descendant[]) => {
  return nodes?.map((n) => Node.string(n)).join('\n')
}
