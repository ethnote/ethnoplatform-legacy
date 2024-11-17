import { FC, useCallback, useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Box, Input, Skeleton, Text } from '@chakra-ui/react'
import { debounce, throttle } from 'lodash'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { Descendant } from 'slate'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import { ContentBox, MultilineText, PageDocument, TextEditor } from 'components'
import { OfflineNote } from '.'

const OfflineNotePage: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { query, push } = useRouter()
  const noteId = query.quickNoteId as string
  const [note, setNote] = useState<OfflineNote>()
  // const { confirm } = useConfirm()
  const [isSaving, setIsSaving] = useState(false)
  const [savedLastTime, setSavedLastTime] = useState<Date>()
  const [tempTitle, setTempTitle] = useState<string>('')
  const { borderColor2 } = useStyle()
  const [didLoadNote, setDidLoadNote] = useState(false)

  const me = api.me.me.useQuery()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const offlineNotes = localStorage.getItem('offlineNotes')
      const offlineNotesParsed = JSON.parse(
        offlineNotes || '[]',
      ) as OfflineNote[]

      const offline = offlineNotesParsed?.find(
        (note: any) => note?.id === noteId,
      )
      const online = JSON.parse(me.data?.personalNotes || '[]')?.find(
        (note: any) => note.id === noteId,
      )

      const note = offline || online

      if (!note) push('/quick-notes')
      setDidLoadNote(true)
      setNote(note)
      setTempTitle(note?.title || '')
    }
  }, [noteId, me.data?.personalNotes])

  const updateSaveState = useCallback(throttle(setIsSaving, 500), [])

  const updateDb = useCallback(
    debounce((existingNote, newContent, title) => {
      if (typeof window !== 'undefined') {
        updateSaveState(true)
        const offlineNotes = localStorage.getItem('offlineNotes')
        const offlineNotesParsed = JSON.parse(offlineNotes || '[]')

        const isOfflineNotes = offlineNotesParsed?.some(
          (offlineNote: any) => offlineNote.id === noteId,
        )

        const updatedNote = {
          ...existingNote,
          title,
          content: newContent,
          updatedAt: new Date(),
        }

        const newOfflineNotes = isOfflineNotes
          ? offlineNotesParsed.map((note: OfflineNote) => {
              if (note.id === noteId) {
                return updatedNote
              }

              return note
            })
          : [...offlineNotesParsed, updatedNote]

        localStorage.setItem('offlineNotes', JSON.stringify(newOfflineNotes))
        updateSaveState(false)
        setSavedLastTime(new Date())
      }
    }, 500),
    [],
  )

  // const onDeleteNoteClicked = () => {
  //   confirm({
  //     title: 'Delete note',
  //     message: 'Are you sure you want to delete this note?',
  //     isDanger: true,
  //     confirmText: 'Delete',
  //     onConfirm: deleteNote,
  //   })
  // }

  // const deleteNote = () => {
  //   if (typeof window !== 'undefined') {
  //     const offlineNotes = localStorage.getItem('offlineNotes')
  //     if (!offlineNotes) return
  //     const offlineNotesParsed = JSON.parse(offlineNotes as unknown as string)
  //     const newOfflineNotes = offlineNotesParsed.filter(
  //       (note: OfflineNote) => note.id !== noteId,
  //     )
  //     localStorage.setItem('offlineNotes', JSON.stringify(newOfflineNotes))
  //     push('/quick-notes')
  //   }
  // }

  const breadcrumbItems = [
    {
      label: 'Quick Notes',
      href: '/quick-notes',
    },
    {
      label: note?.title || 'Note',
      href: '',
    },
  ]

  return (
    <AuthenticatedLayout
      session={session}
      pageTitle='Quick Note'
      isLoading={!note}
      noAuth
    >
      <PageDocument
        header='Quick Note'
        breadcrumbs={breadcrumbItems}
        isSaving={isSaving}
        saveText={
          savedLastTime ? `Saved ${moment(savedLastTime).fromNow()}` : ''
        }
      >
        <ContentBox>
          <Text opacity={0.7}>
            Personal notes are saved on your device, but can be synced to your
            account when you have internet access.
          </Text>
        </ContentBox>
        <ContentBox title='Note'>
          <MultilineText fontSize={'sm'} opacity={0.5} mb={1}>
            Title
          </MultilineText>
          <Input
            value={tempTitle}
            onChange={(e) => {
              updateDb(note, note?.content, e.target.value)
              setTempTitle(e.target.value)
            }}
            borderColor={borderColor2}
            tabIndex={-1}
          />
          <MultilineText mt={4} fontSize={'sm'} opacity={0.5} mb={1}>
            Note
          </MultilineText>
          <Skeleton isLoaded={!!note}>
            {didLoadNote && (
              <Box>
                <Text mb={4}>
                  <TextEditor
                    canEdit={true}
                    initalContent={note?.content as Descendant[]}
                    onChange={(c) => updateDb(note, c, tempTitle)}
                    noteId={noteId}
                    noteFieldId={noteId}
                    withoutHistory
                    hashtags={[]}
                    mentions={[]}
                  />
                </Text>
              </Box>
            )}
          </Skeleton>
        </ContentBox>
        {/* <ContentBox title='Danger Zone'> // Delete from overview
          <Button
            colorScheme='red'
            variant='outline'
            leftIcon={<BsTrash />}
            onClick={onDeleteNoteClicked}
          >
            Delete Note
          </Button>
        </ContentBox> */}
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default OfflineNotePage
