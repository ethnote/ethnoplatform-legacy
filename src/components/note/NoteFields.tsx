import { FC, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Box, Flex, IconButton, Text } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { debounce } from 'lodash'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { AppRouter } from 'server/api/root'
import { Descendant } from 'slate'

import { api } from 'utils/api'
import { useIsMinimizedStore } from 'hooks/useIsMinimizedStore'
import { MultilineText } from 'components'
import TextEditor from 'components/common/TextEditor'

type Props = {
  note?: inferRouterOutputs<AppRouter>['note']['note']
  onNoteFieldChanged: ({
    noteFieldId,
    content,
  }: {
    noteFieldId: string
    content: string
  }) => void
  canEdit: boolean
  isTwelveHour?: boolean
}

type FieldProps = {
  content: Descendant[]
  name: string
  noteFieldId: string
  instruction?: string | null
  index: number
}

const NoteFields: FC<Props> = (p) => {
  const { query } = useRouter()

  const projectHandle = query.projectHandle as string

  const { data: remoteHashtags } = api.note.getHashtags.useQuery(
    {
      projectHandle,
    },
    {
      enabled: !!query.projectHandle,
      refetchOnWindowFocus: false,
    },
  )

  const { data: remoteMentions } = api.note.getMentions.useQuery(
    {
      projectHandle,
    },
    {
      enabled: !!query.projectHandle,
      refetchOnWindowFocus: false,
    },
  )

  const Field = ({
    content,
    name,
    noteFieldId,
    instruction,
    index,
  }: FieldProps) => {
    const { minimizedIds, addMinimizedId, removeMinimizedId } =
      useIsMinimizedStore()

    const minimizeId = 'note-field' + noteFieldId
    const isMinimized = minimizedIds.includes(minimizeId)
    const toggleMinimized = () => {
      isMinimized ? removeMinimizedId(minimizeId) : addMinimizedId(minimizeId)
    }

    const updateDb = useCallback(
      debounce((newContent) => {
        p.onNoteFieldChanged({ noteFieldId, content: newContent })
      }, 500),
      [],
    )

    return (
      <Box mb={isMinimized ? 0 : 8} position='relative'>
        <Flex>
          <Text fontSize='lg' mb={1}>
            {name}
          </Text>
          <IconButton
            transform='translateY(-6%)'
            icon={isMinimized ? <FiChevronDown /> : <FiChevronUp />}
            aria-label=''
            size='sm'
            variant='ghost'
            onClick={toggleMinimized}
          />
        </Flex>
        <Text mb={4} h={isMinimized ? 0 : undefined} overflow='hidden'>
          {instruction && (
            <MultilineText fontSize='sm' opacity={0.5} mb={1}>
              {instruction}
            </MultilineText>
          )}
          <TextEditor
            canEdit={p.canEdit}
            initalContent={content}
            onChange={updateDb}
            noteId={p.note?.id}
            noteFieldId={noteFieldId}
            hashtags={remoteHashtags || []}
            mentions={remoteMentions || []}
            isTwelveHour={p.isTwelveHour}
            index={index}
          />
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      {p.note?.noteFields
        ?.sort((a, b) => (a.order || 0) - (b.order || 0))
        ?.map((field, i) => (
          <Field
            key={i}
            content={(field.content || []) as unknown as Descendant[]}
            name={field.name}
            instruction={field.instruction}
            noteFieldId={field.noteFieldId!}
            index={i}
          />
        ))}
    </Box>
  )
}

export default NoteFields
