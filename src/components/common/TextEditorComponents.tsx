/* eslint-disable react/no-children-prop */
import { FC, ReactElement } from 'react'
import {
  Box,
  Button,
  chakra,
  Divider,
  Flex,
  IconButton,
  MenuButton,
  Switch,
  Tag,
  Text,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import { AiOutlineHighlight } from 'react-icons/ai'
import { BiTime } from 'react-icons/bi'
import { FaAt, FaHashtag } from 'react-icons/fa'
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
} from 'react-icons/md'
import { Editor, Element as SlateElement, Transforms } from 'slate'
import { HistoryEditor } from 'slate-history'
import { ReactEditor, useFocused, useSelected, useSlate } from 'slate-react'

import { DropdownMenu, Walkthrough } from 'components'
import { MentionElement } from 'components/comments/CommentWriteArea'
import { Highlight } from 'components/project/TextEditorCustomHighlight'

type EditorProps = Editor | ReactEditor | HistoryEditor
const LIST_TYPES = ['numbered-list', 'bulleted-list']

const isBlockActive = (editor: EditorProps, format: string) => {
  const nodeGen = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n as any).type === format,
  })

  const node = nodeGen.next()
  while (!node.done) {
    return true
  }
  return false
}

const isMarkActive = (editor: EditorProps, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? (marks as any)[format] === true : false
}

export const toggleBlock = (editor: EditorProps, format: string) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      LIST_TYPES.includes(
        (!Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          (n as any).type) as string,
      ),
    split: true,
  })
  const newProperties = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  } as unknown as Partial<SlateElement>
  Transforms.setNodes(editor, newProperties)

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

export const toggleMark = (editor: EditorProps, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export const MarkButton = ({
  format,
  icon,
  label,
}: {
  format: string
  icon: ReactElement
  label?: string
}) => {
  const editor = useSlate()
  return (
    <Tooltip label={label} openDelay={300}>
      <IconButton
        variant='outline'
        isActive={isMarkActive(editor, format)}
        onMouseDown={(event) => {
          event.preventDefault()
          toggleMark(editor, format)
        }}
        aria-label={format}
        icon={icon}
        borderWidth={0}
        fontSize={'20px'}
      />
    </Tooltip>
  )
}

export const BlockButton = ({
  format,
  icon,
}: {
  format: string
  icon: ReactElement
}) => {
  const editor = useSlate()
  return (
    <IconButton
      variant='outline'
      isActive={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
      aria-label={format}
      icon={icon}
      borderWidth={0}
      fontSize={'20px'}
    />
  )
}

export const NormalButton = ({
  isActive,
  icon,
  onClick,
  label,
}: {
  isActive: boolean
  icon: ReactElement
  onClick: () => void
  label: string
}) => {
  return (
    <Tooltip label={label} openDelay={300}>
      <IconButton
        variant='ghost'
        isActive={isActive}
        onMouseDown={(event) => {
          event.preventDefault()
          onClick()
        }}
        aria-label={label}
        icon={icon}
        fontSize={'20px'}
      />
    </Tooltip>
  )
}

type Props = {
  onTimestampClicked: () => void
  onHashTagClicked: () => void
  onMentionClicked: () => void
  addHighlightSymbol: (symbol: string) => void
  highlights: Highlight[]
  timestampOnNewLine: boolean
  toggleTimestampOnNewLine: () => void
  extra?: any
  index?: number
}

export const Toolbar: FC<Props> = (p) => {
  return (
    <Flex gap={'5px'} borderBottomWidth={1}>
      <Flex gap={'5px'} flexWrap={'wrap'} pb={2}>
        <Walkthrough stepKey='autoTimestamp' hide={p.index !== 0}>
          <Tooltip
            label={
              'Auto timestamp. Toggle this to put a timestamp in your notes every time you press enter twice.'
            }
            openDelay={300}
          >
            <Button
              variant='ghost'
              leftIcon={<BiTime size={20} />}
              rightIcon={
                <Box pointerEvents='none'>
                  <Switch isChecked={p.timestampOnNewLine} />
                </Box>
              }
              fontSize='sm'
              onMouseDown={(event) => {
                event.preventDefault()
                p.toggleTimestampOnNewLine()
              }}
            >
              {/* Timestamp on new line */}
            </Button>
          </Tooltip>
        </Walkthrough>
        <Walkthrough stepKey='addTimestamp' hide={p.index !== 0}>
          <NormalButton
            label='Add timestamp. Shortcut: cmd/ctrl + enter'
            icon={<BiTime />}
            isActive={false}
            onClick={p.onTimestampClicked}
          />
        </Walkthrough>
        <Flex alignItems='center'>
          <Divider orientation='vertical' h={7} />
        </Flex>
        <MarkButton label='Bold' format='bold' icon={<MdFormatBold />} />
        <MarkButton label='Italic' format='italic' icon={<MdFormatItalic />} />
        <MarkButton
          label='Underline'
          format='underline'
          icon={<MdFormatUnderlined />}
        />
        {/* <Flex alignItems='center'>
          <Divider orientation='vertical' h={7} />
        </Flex>
        <BlockButton format='numbered-list' icon={<MdFormatListNumbered />} />
        <BlockButton format='bulleted-list' icon={<MdFormatListBulleted />} /> */}
        <Flex alignItems='center'>
          <Divider orientation='vertical' h={7} />
        </Flex>
        <Walkthrough stepKey='hashtags' hide={p.index !== 0}>
          <NormalButton
            label='Add a hashtag by starting the word with #'
            icon={<FaHashtag size={14} />}
            isActive={false}
            onClick={p.onHashTagClicked}
          />
        </Walkthrough>
        <Walkthrough stepKey='mentions' hide={p.index !== 0}>
          <NormalButton
            label='Add a mention by starting the word with @'
            icon={<FaAt size={14} />}
            isActive={false}
            onClick={p.onMentionClicked}
          />
        </Walkthrough>
        <Walkthrough stepKey='annotations' hide={p.index !== 0}>
          <DropdownMenu
            options={p.highlights.map((h) => ({
              label: `${h.symbol} ${h.name} ${h.symbol}`,
              onClick: () => p.addHighlightSymbol(h.symbol),
            }))}
            tooltip='Add Annotation'
          >
            <MenuButton
              fontWeight='normal'
              as={IconButton}
              variant='ghost'
              icon={<AiOutlineHighlight />}
            />
          </DropdownMenu>
        </Walkthrough>
        <Flex alignItems='center'>
          <Divider orientation='vertical' h={7} />
        </Flex>
        {p.extra}
      </Flex>
    </Flex>
  )
}

const Hashtag = ({ attributes, children, element }: any) => {
  const selected = useSelected()
  const focused = useFocused()

  return (
    <Tag
      colorScheme='red'
      isTruncated={false}
      whiteSpace='normal'
      borderWidth={2}
      mx={0.5}
      borderColor={selected && focused ? '#B4D5FF' : 'transparent'}
    >
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`hashtag-${element?.hashtag?.replace(' ', '-')}`}
      >
        #{element?.hashtag}
        {children}
      </span>
    </Tag>
  )
}

const Mention = ({ attributes, children, element }: any) => {
  const selected = useSelected()
  const focused = useFocused()

  return (
    <Tag
      colorScheme='orange'
      isTruncated={false}
      whiteSpace='normal'
      borderWidth={2}
      mx={0.5}
      borderColor={selected && focused ? '#B4D5FF' : 'transparent'}
    >
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`mention-${element?.hashtag?.replace(' ', '-')}`}
      >
        @{element?.hashtag}
        {children}
      </span>
    </Tag>
  )
}

const CommentMention = ({ attributes, children, element }: any) => {
  const selected = useSelected()
  const focused = useFocused()
  const _element = element as MentionElement

  return (
    <Tag
      colorScheme='blue'
      isTruncated={false}
      whiteSpace='normal'
      borderWidth={2}
      mx={0.5}
      px={1}
      borderColor={selected && focused ? '#B4D5FF' : 'transparent'}
    >
      <span
        {...attributes}
        contentEditable={false}
        data-cy={`hashtag-${element?.hashtag?.replace(' ', '-')}`}
      >
        @{_element.mentionName || _element.mentionEmail}
        {children}
      </span>
    </Tag>
  )
}

export const Element = (
  { attributes, children, element }: any /*RenderElementProps*/,
) => {
  switch (element.type) {
    case 'hashtag':
      return (
        <Hashtag
          attributes={attributes}
          children={children}
          element={element}
        />
      )
    case 'mention':
      return (
        <Mention
          attributes={attributes}
          children={children}
          element={element}
        />
      )
    case 'comment-mention':
      return (
        <CommentMention
          attributes={attributes}
          children={children}
          element={element}
        />
      )
    // case 'list-item':
    //   return <ListItem {...attributes}>{children}</ListItem>
    // case 'numbered-list':
    //   return <OrderedList {...attributes}>{children}</OrderedList>
    // case 'bulleted-list':
    //   return <UnorderedList {...attributes}>{children}</UnorderedList>
    default:
      return <p {...attributes}>{children}</p>
  }
}

export const Leaf = (
  { attributes, children, leaf }: any /*RenderLeafProps*/,
) => {
  const { colorMode } = useColorMode()

  if (leaf.bold) {
    children = (
      <chakra.text fontFamily='Outfit Bold' fontWeight='bold'>
        {children}
      </chakra.text>
    )
  }

  if (leaf.code) {
    children = (
      <chakra.code
        padding={'3px'}
        backgroundColor={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
        fontSize={'90%'}
      >
        {children}
      </chakra.code>
    )
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  if (leaf.tagged) {
    children = <Tag colorScheme='green'>{children}</Tag>
  }

  if (leaf.keyword) {
    children = <Tag colorScheme='red'>{children}</Tag>
  }

  if (leaf.highlight) {
    children = (
      <Tooltip label={leaf.name}>
        <Tag colorScheme={leaf.color} whiteSpace='normal'>
          {children}
        </Tag>
      </Tooltip>
    )
  }

  return <span {...attributes}>{children}</span>
}
