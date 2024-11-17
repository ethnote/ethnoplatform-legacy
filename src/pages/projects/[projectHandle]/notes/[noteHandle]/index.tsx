import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Skeleton,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react'
import { TimeFormat } from '@prisma/client'
import { throttle } from 'lodash'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { BsTrash } from 'react-icons/bs'
import { IoCloudOfflineOutline } from 'react-icons/io5'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { projectBreadcrumbs } from 'utils/projectBreadcrumbs'
import { useConfirm } from 'hooks/useConfirm'
import { useGlobalState } from 'hooks/useGlobalState'
import { useIsOnline } from 'hooks/useIsOnline'
import { useLeavePageConfirm } from 'hooks/useLeavePageConfirm'
import { useStyle } from 'hooks/useStyle'
import {
  CommentArea,
  ContentBox,
  DividerWithText,
  LockedByModal,
  MetadataFields,
  NoteFields,
  NoteFiles,
  NoteFileUploadArea,
  NoteInfo,
  NoteVisibility,
  PageDocument,
  SkeletonPlaceholder,
  Walkthrough,
} from 'components'

const ProjectTemplate: FC = () => {
  const { data: session } = useSession()
  const { query, push } = useRouter()
  const { confirm } = useConfirm()
  const toast = useToast()
  const utils = api.useContext()
  const [isSaving, setIsSaving] = useState(false)
  const [savedLastTime, setSavedLastTime] = useState<Date>()
  const { isOnline } = useIsOnline()
  const { bgSemiTransparent } = useStyle()

  const { lockId } = useGlobalState()
  const [lockModalIsOpen, setLockModalIsOpen] = useState(false)
  const [isTakingOverSession, setIsTakingOverSession] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)

  const {
    data: note,
    isLoading: isLoading,
    fetchStatus,
  } = api.note.note.useQuery(
    {
      handle: query.noteHandle as string,
    },
    {
      enabled: !!query.noteHandle,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
      refetchOnWindowFocus: false,
    },
  )

  const takeOverSession = api.note.takeOverSession.useMutation()

  const isOwner =
    note?.project?.projectMemberships?.find(
      (m) => m?.userId === session?.user.id,
    )?.projectRole === 'PROJECT_OWNER' || note?.author?.id === session?.user.id

  useEffect(() => {
    if (!note?.id || isTakingOverSession || isReadOnly || !isOwner) return
    const isLocked = moment(note?.lockedAt).isAfter(
      moment().subtract(5, 'minutes'),
    )
    const isSameLockId = note?.lockId === lockId

    if (isLocked && !isSameLockId) {
      setLockModalIsOpen(true)
    } else {
      setIsReadOnly(false)
    }
  }, [note?.lockedAt])

  const onTakeOverClick = () => {
    if (!note?.id) return
    takeOverSession.mutate({
      id: note?.id,
      lockId,
    })
    setIsReadOnly(false)
    setIsTakingOverSession(true)
    setLockModalIsOpen(false)
  }

  const isTwelveHour = project?.timeFormat === TimeFormat.TWELVE_HOUR

  useLeavePageConfirm(
    isSaving,
    'You have unsaved changes. Are you sure you want to leave?',
  )

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (isSaving) {
      window.addEventListener('beforeunload', handler)
      return () => {
        window.removeEventListener('beforeunload', handler)
      }
    }
  }, [isSaving])

  const updateNote = api.note.updateNote.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while updating the note',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully updated the note`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.note.note.invalidate()
      utils.project.project.invalidate()
    },
  })

  const deleteNotes = api.project.deleteNotes.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while deleting note',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully deleted note`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      utils.project.project.invalidate()
      utils.note.note.invalidate()
      push(`/projects/${query.projectHandle}/notes`)
    },
    onSettled() {
      utils.project.project.invalidate()
      utils.note.note.invalidate()
    },
  })

  const updateMetadataField = api.note.updateMetadataField.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while saving note',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
  })
  const updateNoteField = api.note.updateNoteField.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while saving note',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
  })

  useEffect(() => {
    updateSaveState(updateMetadataField.isLoading || updateNoteField.isLoading)
  }, [updateMetadataField.isLoading, updateNoteField.isLoading])

  const updateSaveState = useCallback(throttle(setIsSaving, 500), [])

  const onMetadataFieldChanged = ({
    metadataFieldId,
    value,
  }: {
    metadataFieldId: string
    value: string
  }) => {
    if (!note?.id) return

    updateMetadataField.mutate({
      id: note?.id,
      metadataFieldId,
      value,
      lockId,
    })
  }

  const onNoteFieldChanged = ({
    noteFieldId,
    content,
  }: {
    noteFieldId: string
    content: string
  }) => {
    if (!note?.id) return

    updateNoteField.mutate({
      id: note?.id,
      noteFieldId,
      content,
      lockId,
    })
  }

  useEffect(() => {
    if (updateMetadataField.isLoading || updateNoteField.isLoading) {
      setSavedLastTime(new Date())
    }
  }, [updateMetadataField.isLoading, updateNoteField.isLoading])

  const canEdit = !isReadOnly && isOwner

  const metadata = useMemo(() => {
    if (!note?.metadataFields?.length) return <></>

    return (
      <Walkthrough stepKey='contextArea'>
        <ContentBox
          minimizeId={'fieldnote-metadata' + note?.id}
          isMinimizable
          title='Context'
        >
          <Skeleton isLoaded={fetchStatus !== 'fetching'}>
            <MetadataFields
              canEdit={canEdit}
              note={note}
              onMetadataFieldChanged={onMetadataFieldChanged}
            />
          </Skeleton>
        </ContentBox>
      </Walkthrough>
    )
  }, [note, canEdit])

  const notes = useMemo(() => {
    if (!note?.noteFields?.length) return <></>
    return (
      <NoteFields
        canEdit={canEdit}
        note={note}
        onNoteFieldChanged={onNoteFieldChanged}
        isTwelveHour={isTwelveHour}
      />
    )
  }, [note, canEdit])

  if (isLoading) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <SkeletonPlaceholder withHeader w='1140px' />
      </AuthenticatedLayout>
    )
  }

  const breadcrumbItems = projectBreadcrumbs({
    projectName: note?.project?.name,
    projectHandle: query.projectHandle as string,
    noteHandle: query.noteHandle as string,
    noteName: note?.title,
  })

  const setVisible = (isVisible: boolean) => {
    if (!note?.id) return
    updateNote.mutate({
      id: note?.id,
      isVisible,
    })
  }

  const onUpdateNoteTitle = (title: string | undefined | null) => {
    if (!note?.id || !title) return
    updateNote.mutate({
      id: note?.id,
      title,
    })
  }

  const onDeleteNoteClicked = () => {
    if (!note?.id) return
    confirm({
      title: 'Delete fieldnote',
      message: 'Are you sure you want to delete this fieldnote',
      isDanger: true,
      onConfirm: () => {
        note?.id &&
          deleteNotes.mutate({
            ids: [note?.id],
          })
      },
    })
  }

  if (!note?.id)
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <Center>
          <Heading size='lg' mt={10}>
            Note not found
          </Heading>
        </Center>
      </AuthenticatedLayout>
    )

  return (
    <AuthenticatedLayout session={session} pageTitle={note?.title || ''}>
      <PageDocument
        header='Note'
        breadcrumbs={breadcrumbItems.inNote}
        isSaving={isSaving}
        saveText={
          savedLastTime ? `Saved ${moment(savedLastTime).fromNow()}` : ''
        }
      >
        {canEdit ? (
          <NoteVisibility
            accessibilityLevel={note?.project?.accessibilityLevel}
            setVisible={setVisible}
            isVisible={!!note?.isVisible}
          />
        ) : (
          <></>
        )}
        <Walkthrough stepKey='noteInfo'>
          <ContentBox
            minimizeId={'fieldnote-info' + note?.id}
            isMinimizable
            title='Note Info'
          >
            <NoteInfo
              note={note}
              onUpdateNoteTitle={onUpdateNoteTitle}
              canEdit={canEdit}
            />
          </ContentBox>
        </Walkthrough>
        {metadata}
        {!!note?.noteFields?.length && (
          <Walkthrough stepKey='textArea'>
            <ContentBox
              minimizeId={'fieldnote-text' + note?.id}
              isMinimizable
              title='Text'
            >
              <Skeleton isLoaded={fetchStatus !== 'fetching'}>{notes}</Skeleton>
            </ContentBox>
          </Walkthrough>
        )}
        <Walkthrough stepKey='attachments'>
          <ContentBox
            minimizeId={'fieldnote-notearea' + note?.id}
            isMinimizable
            title='Attachments'
          >
            {canEdit ? <NoteFileUploadArea noteId={note?.id} /> : <></>}
            <DividerWithText text='Note Attachments' mt={4} mb={4} />
            <NoteFiles note={note} canEdit={canEdit} />
          </ContentBox>
        </Walkthrough>
        <Walkthrough stepKey='comments'>
          <ContentBox
            minimizeId={'fieldnote-commentarea' + note?.id}
            isMinimizable
            title='Comments'
          >
            <CommentArea note={note} isOwner={canEdit} />
          </ContentBox>
        </Walkthrough>
        {canEdit ? (
          <ContentBox title='Danger Zone'>
            <Button
              colorScheme='red'
              variant='outline'
              leftIcon={<BsTrash />}
              onClick={onDeleteNoteClicked}
            >
              Delete note
            </Button>
          </ContentBox>
        ) : (
          <></>
        )}
      </PageDocument>
      {updateMetadataField.isLoading ||
        (updateNoteField.isLoading && (
          <Box position='fixed' bottom={4} right={4}>
            <Spinner opacity={0.5} />
          </Box>
        ))}
      <LockedByModal
        isOpen={lockModalIsOpen}
        onReadOnlyClick={() => {
          setIsReadOnly(true)
          setLockModalIsOpen(false)
        }}
        onTakeOverClick={onTakeOverClick}
        lockedByName={note?.lockedByUser?.fullName || note?.lockedByUser?.email}
        lockedByHue={note?.lockedByUser?.avatarHue}
      />
      {!isOnline && (
        <Flex
          position='fixed'
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={bgSemiTransparent}
          alignItems='center'
          justifyContent='center'
          flexDir='column'
        >
          <IoCloudOfflineOutline size={30} />
          <Text fontSize='lg' my={2}>
            You&rsquo;re offline. Changes will not be saved.
          </Text>
          <Input autoFocus display='none' />
          <Button
            size='sm'
            colorScheme='blue'
            variant='ghost'
            ml={2}
            onClick={() => push('/quick-notes')}
          >
            Go to quick notes
          </Button>
        </Flex>
      )}
    </AuthenticatedLayout>
  )
}

export default ProjectTemplate
