import { FC, useCallback, useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  useToast,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { omit } from 'lodash'
import moment from 'moment'
import { nanoid } from 'nanoid'
import { useSession } from 'next-auth/react'
import { AiOutlineCloudUpload, AiOutlinePlus } from 'react-icons/ai'
import { Node } from 'slate'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { useIsOnline } from 'hooks/useIsOnline'
import {
  ButtonVariant,
  ContentBox,
  MovePersonalNoteToProject,
  NoteCard,
  PageDocument,
} from 'components'

export type OfflineNote = {
  id: string
  title: string
  content: Record<string, any>[]
  createdAt: Date
  updatedAt: Date
  fullName: string
  email: string
  isOnline?: boolean
  isOnlyOnline?: boolean
  isOnlyOffline?: boolean
  isIdentical?: boolean
}

const OfflineNotes: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { push } = useRouter()
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [offlineNotes, setOfflineNotes] = useState<OfflineNote[]>([])
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const { isOnline } = useIsOnline()
  const [moveToProjectIsOpen, setMoveToProjectIsOpen] = useState(false)
  const toast = useToast()

  const me = api.me.me.useQuery()
  const movePersonalNote = api.project.movePersonalNote.useMutation()

  useEffect(() => {
    getOfflineNotes()
  }, [])

  const getOfflineNotes = () => {
    if (typeof window !== 'undefined') {
      const offlineNotes = localStorage.getItem('offlineNotes')
      if (!offlineNotes) return setOfflineNotes([])
      const offlineNotesParsed = JSON.parse(offlineNotes as unknown as string)
      setOfflineNotes(offlineNotesParsed)
    }
  }

  const onlineNotes = JSON.parse(me.data?.personalNotes || '[]') as
    | OfflineNote[]
    | undefined

  const updateUser = api.me.updateUser.useMutation({
    onSuccess: () => {
      localStorage.removeItem('offlineNotes')
    },
    onSettled: () => {
      utils.me.me.invalidate()
    },
  })

  useEffect(() => {
    getOfflineNotes()
  }, [me.data?.personalNotes])

  const onSelectToggle = (id: string) => {
    if (selectedNotes.includes(id)) {
      setSelectedNotes(selectedNotes.filter((noteId) => noteId !== id))
    } else {
      setSelectedNotes([...selectedNotes, id])
    }
  }

  const onDeleteSelectedNotesClicked = () => {
    confirm({
      title: 'Delete notes',
      message: `Are you sure you want to delete ${selectedNotes.length} note${
        selectedNotes.length > 1 ? 's' : ''
      }?`,
      isDanger: true,
      confirmText: 'Delete',
      onConfirm: () => deleteSelectedNotes({ hideAlert: false }),
    })
  }

  const onNewOfflineNoteClicked = () => {
    const newNote = {
      id: nanoid(4),
      title: moment().format('MMM D, YYYY - HH.mm'),
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      fullName: me.data?.fullName || '',
      email: session?.user.email,
    } as OfflineNote

    // Save to local storage
    const offlineNotes = JSON.parse(
      localStorage.getItem('offlineNotes') || '[]',
    ) as OfflineNote[]

    localStorage.setItem(
      'offlineNotes',
      JSON.stringify([...offlineNotes, newNote]),
    )

    setOfflineNotes([...offlineNotes, newNote])
    push(`/quick-notes/${newNote.id}`)
  }
  const selectAll = () => {
    if (selectedNotes.length === notesToShow()?.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(notesToShow()?.map((note) => note?.id) || [])
    }
  }

  const deselectAll = () => {
    setSelectedNotes([])
  }

  const exportNotes = () => {
    const notes = offlineNotes
      ?.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .reduce((acc, note) => {
        let curr = acc

        curr += `${note.title}\n\n`

        const serialize = (nodes: any[]) => {
          return nodes?.map((n) => Node.string(n)).join('\n')
        }

        curr += `${serialize(note.content)}\n\n`
        curr += '___________________________\n\n'

        return curr
      }, '')

    // Download TXT
    const txtString = `data:text/plain;chatset=utf-8,${encodeURIComponent(
      notes,
    )}`
    const link = document.createElement('a')
    link.href = txtString
    link.download = `export_${moment().format('DD_MM_YYYY')}.txt`

    link.click()
  }

  const notesToShow = useCallback(() => {
    const onlineChecked = (onlineNotes || [])?.map((note) => {
      const localNote = offlineNotes?.find((n) => n.id === note.id)
      const isIdentical =
        JSON.stringify(note.content) ===
        JSON.stringify(offlineNotes?.find((n) => n.id === note.id)?.content)

      return {
        ...(localNote ?? note),
        isOnline: true,
        isOnlyOnline: !localNote,
        isIdentical,
      }
    })

    const onlyOffline = offlineNotes
      ?.filter((note) => {
        const isOnlyOffline = !onlineNotes?.find((n) => n.id === note.id)
        return isOnlyOffline
      })
      .map((note) => ({ ...note, isOnlyOffline: true }))

    return [...(onlineChecked || []), ...(onlyOffline || [])]
  }, [offlineNotes, onlineNotes])

  const syncPersonalNotes = async () => {
    const personalNotes = notesToShow().map((note) =>
      omit(note, ['isOnline', 'isOnlyOnline', 'isOnlyOffline', 'isIdentical']),
    )

    updateUser.mutate({
      personalNotes: JSON.stringify(personalNotes),
    })
  }

  const deleteSelectedNotes = ({
    hideAlert = false,
  }: {
    hideAlert?: boolean
  }) => {
    const personalNotes = notesToShow().map((note) =>
      omit(note, ['isOnline', 'isOnlyOnline', 'isOnlyOffline', 'isIdentical']),
    )

    const anyOnline = notesToShow().some((note) => note.isOnline)

    if (!isOnline && anyOnline && !hideAlert) {
      alert({
        title: 'Offline',
        message:
          'You are offline and trying to delete online notes, please connect to the internet and try again.',
      })
      return
    }

    const offlineNotes = JSON.parse(
      localStorage.getItem('offlineNotes') || '[]',
    ) as OfflineNote[]

    const filteredNotes = offlineNotes?.filter(
      (note) => !selectedNotes.includes(note?.id),
    )

    localStorage.setItem('offlineNotes', JSON.stringify(filteredNotes))
    setOfflineNotes(filteredNotes)
    setSelectedNotes([])

    if (anyOnline) {
      updateUser.mutate({
        personalNotes: JSON.stringify(
          personalNotes.filter((note) => !selectedNotes.includes(note?.id)),
        ),
      })
    }
  }

  const moveToProject = (projectHandle: string) => {
    const successfullyDeletedNotes = []

    for (const noteId of selectedNotes) {
      const note = notesToShow()?.find((note) => note.id === noteId)
      if (!note) continue

      try {
        movePersonalNote.mutateAsync({
          projectHandle,
          title: note?.title || '',
          content: note?.content || {},
        })

        successfullyDeletedNotes.push(noteId)
      } catch (e) {
        toast({
          title: `Error moving ${note?.title} to project`,
          status: 'error',
          duration: 6000,
          isClosable: true,
        })
      }
    }

    setSelectedNotes(successfullyDeletedNotes)
    setTimeout(() => {
      deleteSelectedNotes({ hideAlert: true })

      toast({
        title: `Successfully moved fieldnote${
          selectedNotes.length > 1 ? 's' : ''
        } to project`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })

      setMoveToProjectIsOpen(false)
    }, 0)
  }

  const projects = me.data?.projectMemberships
    ?.map((pm) => pm.project)
    .filter((p) => !!p)
    .filter(Boolean)
    .map((p) => ({
      label: p!.name,
      value: p!.handle,
    })) as { label: string; value: string }[]

  const allSelected =
    selectedNotes.length === notesToShow()?.length && notesToShow()?.length > 0

  return (
    <AuthenticatedLayout session={session} pageTitle='Quick Notes' noAuth>
      <PageDocument header='Quick Notes'>
        <ContentBox>
          <Flex
            justifyContent='space-between'
            gap={2}
            flexDir={{ base: 'column', md: 'row' }}
          >
            <ButtonGroup>
              <Button
                variant='outline'
                onClick={allSelected ? deselectAll : selectAll}
                isDisabled={!notesToShow()?.length}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
              <Menu>
                <MenuButton
                  opacity={selectedNotes.length > 0 ? 1 : 0.4}
                  fontWeight='normal'
                  as={Button}
                  variant='outline'
                  rightIcon={<ChevronDownIcon />}
                >
                  Actions
                </MenuButton>
                <Portal>
                  <MenuList>
                    <MenuItem
                      isDisabled={!selectedNotes.length || !isOnline}
                      onClick={() => setMoveToProjectIsOpen(true)}
                    >
                      Move{' '}
                      {selectedNotes.length !== 1 ? 'fieldnotes' : 'fieldnote'}{' '}
                      to project
                    </MenuItem>
                    <MenuItem
                      isDisabled={!selectedNotes.length}
                      onClick={exportNotes}
                    >
                      Export
                    </MenuItem>
                    <MenuItem
                      isDisabled={!selectedNotes.length}
                      onClick={onDeleteSelectedNotesClicked}
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </ButtonGroup>
            <ButtonGroup>
              <Button
                leftIcon={<AiOutlineCloudUpload />}
                variant='outline'
                isLoading={updateUser.isLoading}
                onClick={syncPersonalNotes}
                isDisabled={!isOnline}
              >
                Sync
              </Button>
              <ButtonVariant
                leftIcon={<AiOutlinePlus />}
                variant='outline'
                colorScheme='blue'
                onClick={onNewOfflineNoteClicked}
              >
                New quick note
              </ButtonVariant>
            </ButtonGroup>
          </Flex>
          <Box mt={4}>
            {notesToShow()
              ?.sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              )
              ?.map((note, i) => (
                <NoteCard
                  key={note.id}
                  isFirst={i === 0}
                  isLast={i === notesToShow()?.length - 1}
                  onClick={() => push(`/quick-notes/${note.id}`)}
                  title={note.title}
                  createdAt={note.createdAt}
                  updatedAt={note.updatedAt}
                  createdByName={note.fullName}
                  createdByEmail={note.email}
                  isSelected={selectedNotes.includes(note.id)}
                  onSelectToggle={() => onSelectToggle(note.id)}
                  onlyVisibleToYou={false}
                  tags={
                    [
                      note.isOnline && note.isIdentical ? 'Online' : undefined,
                      note.isOnlyOnline ? 'Only Online' : undefined,
                      note.isOnline && !note.isIdentical && !note.isOnlyOnline
                        ? 'Not Synced'
                        : undefined,
                      note.isOnlyOffline ? 'Only Local' : undefined,
                    ].filter(Boolean) as string[]
                  }
                />
              ))}
          </Box>
        </ContentBox>

        <Center>
          <Button variant='outline' onClick={() => push('/projects')}>
            Go to projects
          </Button>
        </Center>
      </PageDocument>
      <MovePersonalNoteToProject
        isOpen={moveToProjectIsOpen}
        onClose={() => {
          setMoveToProjectIsOpen(false)
        }}
        onConfirm={moveToProject}
        options={projects || []}
      />
    </AuthenticatedLayout>
  )
}

export default OfflineNotes
