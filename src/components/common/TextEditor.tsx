import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  IconButton,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  BORDER_RADIUS,
  DEFAULT_TEXT_EDITOR_HIGHLIGHT,
} from 'constants/constants'
import isHotkey from 'is-hotkey'
import moment from 'moment'
import ReactDOM from 'react-dom'
import { MdHistory } from 'react-icons/md'
import {
  createEditor,
  Descendant,
  Editor,
  Range,
  Text as SlateText,
  Transforms,
} from 'slate'
import { withHistory } from 'slate-history'
import { Editable, ReactEditor, Slate, withReact } from 'slate-react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { api } from 'utils/api'
import { getHashtags, getMentions } from 'utils/slate'
import { useSharedHashtags } from 'hooks/useSharedHashtags'
import { useSharedMentions } from 'hooks/useSharedMentions'
import { useStyle } from 'hooks/useStyle'
import { TextEditorHistoryModal, Walkthrough } from 'components'
import { Highlight } from 'components/project/TextEditorCustomHighlight'
import { Element, Leaf, Toolbar } from './TextEditorComponents'

// Hashtags: https://github.com/ianstormtaylor/slate/blob/main/site/examples/mentions.tsx

interface TimestampOnNewLineState {
  timestampOnNewLine: Record<string, boolean>
  setTimestampOnNewLine: (toggleId: string) => void
}

const useViewModeStore = create<TimestampOnNewLineState>()(
  devtools(
    persist(
      (set) => ({
        timestampOnNewLine: {},
        setTimestampOnNewLine: (toggleId: string) => {
          set((state) => ({
            timestampOnNewLine: {
              ...state.timestampOnNewLine,
              [toggleId]: !state.timestampOnNewLine[toggleId],
            },
          }))
        },
      }),
      {
        name: 'timestamp-on-new-line',
      },
    ),
  ),
)

type Props = {
  initalContent?: Descendant[]
  onChange?: (value: Descendant[]) => void
  noteId?: string
  noteFieldId?: string
  canEdit?: boolean
  withoutHistory?: boolean
  hashtags: string[]
  mentions: string[]
  isTwelveHour?: boolean
  index?: number
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

const TextEditor: FC<Props> = (p) => {
  const { localHashtags, updateLocalHashtags } = useSharedHashtags()
  const { localMentions, updateLocalMentions } = useSharedMentions()

  const [localContent, setLocalContent] = useState<Descendant[]>([])
  const { bg } = useStyle()

  const { query } = useRouter()
  const local = Object.values(
    localHashtags[query.projectHandle as string] || {},
  )?.flatMap((h) => h)

  const mentionsLocal = Object.values(
    localMentions[query.projectHandle as string] || {},
  )?.flatMap((h) => h)

  const values = [...new Set([...local, ...p.hashtags])]
  const valuesMentions = [...new Set([...mentionsLocal, ...p.mentions])]

  const ref = useRef<HTMLDivElement | null>(null)

  // hashtags
  const [target, setTarget] = useState<Range | undefined | null>()
  const [index, setIndex] = useState(0)
  const [search, setSearch] = useState<string | undefined>('')

  const [isMention, setIsMention] = useState(false)

  const readOnlyBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50')

  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])
  const [editor] = useState(() =>
    withHashtags(withHistory(withReact(createEditor()))),
  )
  const {
    timestampOnNewLine: _timestampOnNewLine,
    setTimestampOnNewLine: _setTimestampOnNewLine,
  } = useViewModeStore()

  const timestampOnNewLineId = (p.noteFieldId || '') + (p.noteId || '')

  const timestampOnNewLine =
    timestampOnNewLineId &&
    _timestampOnNewLine.hasOwnProperty(timestampOnNewLineId)
      ? _timestampOnNewLine[timestampOnNewLineId]
      : false

  const toggleTimestampOnNewLine = useCallback(() => {
    !timestampOnNewLine && insertTimestamp()
    timestampOnNewLineId && _setTimestampOnNewLine(timestampOnNewLineId)
  }, [timestampOnNewLineId, _setTimestampOnNewLine, timestampOnNewLine])

  const { data: me } = api.me.me.useQuery()
  const { timestampShortcutCode } = me || {
    timestampShortcutCode: 'enter',
  }

  const [historyIsOpen, setHistoryIsOpen] = useState(false)
  const initialContent = useRef<Descendant[]>(
    p.initalContent?.length ? p.initalContent : defaultContent,
  ).current
  const [enterPressCount, setEnterPressCount] = useState(0)

  const readOnlyProps = p.canEdit
    ? {}
    : {
        borderWidth: 0,
        bg: readOnlyBg,
      }

  const noteFieldHistory = api.note.getNoteFieldHistory.useQuery(
    {
      noteId: p.noteId,
      noteFieldId: p.noteFieldId,
    },
    {
      refetchInterval: 1000 * 60 * 2,
      enabled: !p.withoutHistory,
    },
  )
  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  )

  const highlights = (
    project?.textEditorHighlights?.length
      ? project?.textEditorHighlights
      : DEFAULT_TEXT_EDITOR_HIGHLIGHT
  ) as Highlight[]

  const moveCursorDelteChar = (chars: number) => {
    if (editor.selection && editor.selection.anchor.offset > 0) {
      Transforms.select(editor, {
        anchor: {
          path: editor.selection.anchor.path,
          offset: editor.selection.anchor.offset + chars,
        },
        focus: {
          path: editor.selection.focus.path,
          offset: editor.selection.focus.offset + chars,
        },
      })
    }
  }

  const insertTimestamp = () => {
    editor.insertText(
      p.isTwelveHour
        ? `${moment().format('h:mm A')}: `
        : `${moment().format('HH:mm')}: `,
    )
  }

  const insertHashtagSymbol = () => {
    editor.insertText('#')
  }

  const insertMentionSymbol = () => {
    editor.insertText('@')
  }

  const chars = (isMention ? valuesMentions : values)
    .filter((c) => search && c.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 10)

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (target) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          const prevIndex = index >= chars.length ? 0 : index + 1
          setIndex(prevIndex)
          break
        case 'ArrowUp':
          event.preventDefault()
          const nextIndex = index <= 0 ? chars.length : index - 1
          setIndex(nextIndex)
          break
        case 'Tab':
        case ' ':
        case 'Enter':
          if (event.key === ' ') {
            if (chars.length > 1) return
            if (chars.length === 1 && chars[0] !== search) return
          }

          event.preventDefault()
          Transforms.select(editor, target as any)
          typeof chars[index] === 'string' &&
            insertHashtag(editor, chars[index] as string)
          if (chars.length === index) {
            if (!search) return
            Transforms.select(editor, target as any)
            insertHashtag(editor, search)
            setTarget(null)
          }
          setTarget(null)
          break
        case 'Escape':
          event.preventDefault()
          setTarget(null)
          break
      }
    } else {
      if (isHotkey(`mod+${timestampShortcutCode || 'enter'}`, event as any)) {
        event.preventDefault()
        insertTimestamp()
        setEnterPressCount(0)
      } else if (timestampOnNewLine && event.key === 'Enter') {
        setEnterPressCount((p) => p + 1)
        if (enterPressCount === 1) {
          event.preventDefault()

          editor.insertText(
            p.isTwelveHour
              ? `\n${moment().format('h:mm A')}: `
              : `\n${moment().format('HH:mm')}: `,
          )

          setEnterPressCount(0)
        }
      } else if (event.key === 'Unidentified') {
        // do nothing for android
      } else {
        setEnterPressCount(0)
      }
    }
  }

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

  const onHistoryClicked = () => {
    noteFieldHistory.refetch()
    setHistoryIsOpen(true)
  }

  const decorate = ([node, path]: [any, any]) => {
    if (!SlateText.isText(node)) {
      return []
    }
    const ranges = []
    const tokens = tokenize(node.text)
    let start = 0
    for (const token of tokens) {
      const end = start + getLength(token)
      if (typeof token !== 'string') {
        ranges.push({
          [token.type]: true,
          color: token.color,
          name: token.name,
          anchor: { path, offset: start },
          focus: { path, offset: end },
        })
      }
      start = end
    }
    return ranges
  }

  type Content = (
    | string
    | { content: string; type: string; name: string; color: string }
  )[]

  const matchRegex = (
    text: string,
    tokenTypes: TokenType[],
    level: number,
  ): Content => {
    if (level === tokenTypes.length) return [text]
    const { regex, name, color } = tokenTypes[level] as TokenType

    return text
      .split(regex)
      .flatMap((x) =>
        regex.test(x)
          ? { content: x, type: 'highlight', name, color } // only one level
          : matchRegex(x, tokenTypes, level + 1),
      )
      .filter(Boolean)
  }

  type TokenType = {
    name: string
    color: string
    type: string
    regex: RegExp
  }

  const getWordRegex = (char: string): RegExp => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = `(${escapedChar}.*?${escapedChar})`
    return new RegExp(pattern, 'g')
  }

  const types = highlights.map((h) => ({
    ...h,
    type: h.name,
    regex: getWordRegex(h.symbol),
  })) as TokenType[]

  const tokenize = (text: string) => {
    if (text === '') return []
    const tokens = matchRegex(
      text.replaceAll('”', '"').replaceAll('“', '"'),
      types,
      0,
    )
    return tokens
  }

  const getLength = (token: Content[number]) =>
    typeof token === 'string'
      ? token.length
      : typeof token.content === 'string'
        ? token.content.length
        : 0

  const insertHashtag = (editor: Editor, hashtag: string) => {
    const hashtagElement: HashtagElement = {
      type: isMention ? 'mention' : 'hashtag',
      hashtag,
      children: [{ text: symbol + hashtag }],
    }
    Transforms.insertNodes(editor, hashtagElement)
    Transforms.move(editor)
    const newHashtags = getHashtags(localContent)
    const projectHandle = query.projectHandle as string
    updateLocalHashtags(projectHandle, p.noteFieldId as string, [
      hashtag,
      ...newHashtags,
    ])
  }

  const addHighlightSymbol = (symbol: string) => {
    // If something is selected, put on either side
    let middle = ''
    if (editor.selection) {
      middle = Editor.string(editor, editor.selection)
    }

    const space = symbol === '"' ? '' : ' '

    editor.insertText(`${symbol}${space}${middle}${space}${symbol}`)
    ReactEditor.focus(editor as ReactEditor)
    moveCursorDelteChar(-(symbol.length + space.length))

    // Focus editor
    setTimeout(() => {
      ReactEditor.focus(editor as ReactEditor)
    }, 100)
  }

  const symbol = isMention ? '@' : '#'

  type HashtagSuggestionsProps = {
    onClick: (newValue: string) => void
    index: number
    remoteHashtags: string[]
  }

  const HashtagSuggestions = (p: HashtagSuggestionsProps) => {
    return (
      <Box>
        {p.remoteHashtags.map((val, i) => (
          <Box
            key={val}
            onMouseDown={(e) => {
              e.preventDefault()
              p.onClick(val)
            }}
            padding={'1px 3px'}
            borderRadius={'3px'}
            cursor='pointer'
            _hover={{ bg: 'blue.400' }}
            background={i === p.index ? 'blue.500' : 'transparent'}
            p={1}
            px={2}
          >
            {symbol}
            {val}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <>
      <Box
        borderWidth={1}
        borderRadius={BORDER_RADIUS}
        p={2}
        {...readOnlyProps}
      >
        <Slate
          editor={editor as ReactEditor}
          value={initialContent}
          onChange={(v) => {
            if (!p.canEdit) return
            const { selection } = editor

            if (selection && Range.isCollapsed(selection)) {
              const [start] = Range.edges(selection)
              const wordBefore = Editor.before(editor, start, { unit: 'word' })
              const before = wordBefore && Editor.before(editor, wordBefore)
              const beforeRange = before && Editor.range(editor, before, start)
              const beforeText =
                beforeRange && Editor.string(editor, beforeRange)

              const beforeMatch =
                beforeText && beforeText.match(/^#(([^\x00-\x7F]|\w)+)$/)
              const beforeMatchMention =
                beforeText && beforeText.match(/^@(([^\x00-\x7F]|\w)+)$/)
              setIsMention(!!beforeMatchMention)

              const after = Editor.after(editor, start)
              const afterRange = Editor.range(editor, start, after)
              const afterText = Editor.string(editor, afterRange)
              const afterMatch = afterText.match(/^(\s|$)/)

              if ((beforeMatch || beforeMatchMention) && afterMatch) {
                const newHashtags = getHashtags(v)
                const newMentions = getMentions(v)
                const projectHandle = query.projectHandle as string

                updateLocalHashtags(
                  projectHandle,
                  p.noteFieldId as string,
                  newHashtags,
                )

                updateLocalMentions(
                  projectHandle,
                  p.noteFieldId as string,
                  newMentions,
                )

                setTarget(beforeRange as any)

                beforeMatch?.[1] && setSearch(beforeMatch[1])
                beforeMatchMention?.[1] && setSearch(beforeMatchMention[1])

                setIndex(0)
                return
              }
            }

            setTarget(null)
            p.onChange?.(v)
            setLocalContent(v)
          }}
        >
          {p.canEdit ? (
            <Toolbar
              timestampOnNewLine={!!timestampOnNewLine}
              toggleTimestampOnNewLine={toggleTimestampOnNewLine}
              onTimestampClicked={insertTimestamp}
              onHashTagClicked={insertHashtagSymbol}
              onMentionClicked={insertMentionSymbol}
              addHighlightSymbol={addHighlightSymbol}
              highlights={highlights}
              index={p.index}
              extra={
                p.canEdit &&
                !p.withoutHistory && (
                  <Walkthrough stepKey='history' hide={p.index !== 0}>
                    <Tooltip label='Revision history'>
                      <IconButton
                        variant='ghost'
                        icon={<MdHistory />}
                        fontSize='sm'
                        onClick={onHistoryClicked}
                        aria-label={'Revision history'}
                      />
                    </Tooltip>
                  </Walkthrough>
                )
              }
            />
          ) : (
            <></>
          )}
          <Box p={2}>
            <Editable
              spellCheck
              style={{
                minHeight: '140px',
                maxHeight: '700px',
                overflow: 'auto',
              }}
              decorate={decorate}
              onKeyDown={onKeyDown}
              readOnly={!p.canEdit}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              tabIndex={-1} // Fix problem with jumping cursor from prev/next buttons on mobile
            />
            {target && (
              <Portal>
                <Box
                  ref={ref}
                  top='-9999px'
                  left='-9999px'
                  position='absolute'
                  padding='3px'
                  bg={bg}
                  borderWidth={1}
                  borderRadius='4px'
                  boxShadow='0 1px 5px rgba(0,0,0,.2)'
                  data-cy='hashtag-portal'
                >
                  <HashtagSuggestions
                    remoteHashtags={chars}
                    onClick={(newValue) => {
                      Transforms.select(editor, target)
                      insertHashtag(editor, newValue)
                      setTarget(null)
                    }}
                    index={index}
                  />
                  <Box // TODO: don't show if exact match
                    padding={'1px 3px'}
                    borderRadius={'3px'}
                    cursor='pointer'
                    _hover={{ bg: 'blue.400' }}
                    background={
                      chars.length === index ? 'blue.500' : 'transparent'
                    }
                    onMouseDown={(e) => {
                      if (!search) return

                      e.preventDefault()
                      Transforms.select(editor, target)
                      insertHashtag(editor, search)
                      setTarget(null)
                    }}
                  >
                    <Text opacity={0.6} display='inline-block'>
                      Create
                    </Text>{' '}
                    {symbol}
                    {search}
                  </Box>
                </Box>
              </Portal>
            )}
          </Box>
        </Slate>
        <TextEditorHistoryModal
          isOpen={historyIsOpen}
          onClose={() => setHistoryIsOpen(false)}
          history={noteFieldHistory.data}
        />
      </Box>
    </>
  )
}

export default TextEditor

const withHashtags = (editor: Editor) => {
  const { isInline, isVoid, markableVoid } = editor

  editor.isInline = (element: any) => {
    return ['hashtag', 'mention'].includes(element.type)
      ? true
      : isInline(element)
  }

  editor.isVoid = (element: any) => {
    return ['hashtag', 'mention'].includes(element.type)
      ? true
      : isVoid(element)
  }

  editor.markableVoid = (element: any) => {
    return (
      ['hashtag', 'mention'].includes(element.type) || markableVoid(element)
    )
  }

  return editor
}

export type HashtagElement = {
  type: 'hashtag' | 'mention'
  hashtag: string
  children: CustomText[]
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
