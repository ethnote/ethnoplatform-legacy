import { FC, useState } from 'react'
import { Center, Grid, Text, useToast } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { saveAs } from 'file-saver'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { MediaViewer } from 'components'
import FileCard from 'components/project/FileCard'
import RenameFileModal from './EditFileModal'

type Props = {
  note?: inferRouterOutputs<AppRouter>['note']['note']
  canEdit?: boolean
}

const NoteFiles: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const { confirm } = useConfirm()
  const [fileToEdit, setFileToEdit] = useState<string | null>(null)
  const [indexToView, setIndexToView] = useState<number>()

  const downloadFile = api.note.getFileUrl.useMutation({
    onSuccess({ signedUrl, file }) {
      saveAs(signedUrl, file.name)
    },
    onSettled() {
      utils.note.note.invalidate()
    },
  })

  const deleteFile = api.note.deleteFile.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while deleting the file',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully deleted file`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.note.note.invalidate()
    },
  })

  const onDeleteClicked = (fileId: string) => {
    confirm({
      title: 'Delete file',
      message: 'Are you sure you want to delete this file?',
      isDanger: true,
      confirmText: 'Delete',
      onConfirm: () =>
        deleteFile.mutate({
          id: fileId,
        }),
    })
  }

  const onDownloadClicked = (fileId: string) => {
    downloadFile.mutate({
      id: fileId,
    })
  }

  if (!p.note?.files?.length)
    return (
      <Center mb={4}>
        <Text opacity={0.5}>No attachments added yet</Text>
      </Center>
    )

  const getTimeWrapper = (date: Date | any) => {
    if (typeof date.getTime === 'function') {
      return date.getTime()
    }
    return date
  }

  // TODO: hide edit and delete button if user is not the owner or project owner

  return (
    <Grid templateColumns='repeat(auto-fill, minmax(200px, 1fr))' gap={2}>
      {p.note?.files
        .sort(
          (a, b) => getTimeWrapper(b?.createdAt) - getTimeWrapper(a?.createdAt),
        )
        .map((file) => (
          <FileCard
            key={file.id}
            id={file.id}
            filename={file.name}
            size={file.size}
            mimeType={file.mimeType}
            createdAt={file.createdAt}
            caption={file.caption ?? undefined}
            onDeleteClicked={
              p.canEdit ? () => onDeleteClicked(file.id) : undefined
            }
            onDownloadClicked={() => onDownloadClicked(file.id)}
            onEditClicked={p.canEdit ? () => setFileToEdit(file.id) : undefined}
            fileUrl={file.signedUrl}
            thumbnailUrl={file.thumbnail ?? undefined}
            blurhash={file.blurhash ?? undefined}
            duration={file.duration ?? undefined}
            onClick={() => setIndexToView(p.note?.files?.indexOf(file))}
          />
        ))}
      <RenameFileModal
        fileId={fileToEdit}
        isOpen={!!fileToEdit}
        onClose={() => setFileToEdit(null)}
        initialValues={{
          name: p.note?.files.find((f) => f.id === fileToEdit)?.name || '',
          caption:
            p.note?.files.find((f) => f.id === fileToEdit)?.caption ??
            undefined,
        }}
      />
      <MediaViewer
        setSelectedIndex={setIndexToView}
        selectedIndex={indexToView}
        media={p.note?.files.map((f) => ({
          filename: f.name,
          mimeType: f.mimeType,
          url: f.signedUrl,
          caption: f.caption,
        }))}
      />
    </Grid>
  )
}

export default NoteFiles
