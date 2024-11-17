import { FC, useEffect, useState } from 'react'
import { useToast } from '@chakra-ui/react'
import { capitalize } from 'lodash'

import { api } from 'utils/api'
import { uploadFile } from 'utils/uploadFile'
import { FileUploadArea, Webcam } from 'components'

type Props = {
  noteId?: string
}

const NoteFileUploadArea: FC<Props> = (p) => {
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState('')
  const utils = api.useContext()
  const toast = useToast()
  const [filesToUpload, setFilesToUpload] = useState<File[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [currentController, setCurrentController] = useState<AbortController>()
  const [fileIdBeingUploaded, setFileIdBeingUploaded] = useState<string>()

  const uploadFileCompleted = api.note.uploadFileCompleted.useMutation({
    onError(err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully uploaded file`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    async onSettled() {
      utils.note.note.invalidate()
      setProgress(undefined)
    },
  })

  const getSignedUrl = api.note.uploadFile.useMutation({
    onError(err) {
      setError(err.message)
    },
  })

  const deleteFile = api.note.deleteFile.useMutation()

  useEffect(() => {
    ;(async () => {
      if (!filesToUpload || !p.noteId) return
      setIsUploading(true)
      for (const fileToUpload of filesToUpload) {
        const res = await getSignedUrl.mutateAsync({
          noteId: p.noteId,
          filename: fileToUpload.name,
          mimeType: fileToUpload.type,
          size: fileToUpload.size,
        })

        if (!res?.signedUrl || !fileToUpload) return

        try {
          const controller = new AbortController()

          setCurrentController(controller)
          setFileIdBeingUploaded(res.file.id)

          await uploadFile(
            res?.signedUrl,
            fileToUpload,
            (_, percent) => {
              setProgress(percent)
            },
            controller,
          )

          p.noteId &&
            res.file.id &&
            uploadFileCompleted.mutate({
              noteId: p.noteId,
              fileId: res.file.id,
            })
        } catch (e: any) {
          console.log(e)
          setError(capitalize(JSON.parse(e).message))
        }
      }
      setIsUploading(false)
      setFilesToUpload(null)
    })()
  }, [filesToUpload])

  const onAbort = () => {
    currentController?.abort()
    setFilesToUpload(null)
    setIsUploading(false)
    setProgress(undefined)

    fileIdBeingUploaded &&
      deleteFile.mutate({
        id: fileIdBeingUploaded,
      })
  }

  return (
    <>
      <FileUploadArea
        // supportedFilesText='Supported files: .jpg, .png, .pdf .mp3'
        maxFileSize={0.25 * 1024 * 1024 * 1024}
        uploadFiles={setFilesToUpload}
        progress={progress}
        error={error}
        setError={(e) => setError(e)}
        isUploading={isUploading}
        onAbort={onAbort}
        // supporedMimeTypes={[
        //   'image/jpeg',
        //   'image/png',
        //   'application/pdf',
        //   'audio/x-matroska',
        //   'audio/mp3',
        //   'audio/mp4',
        //   'audio/mpeg',
        //   'audio/mpeg3',
        // ]}
      />
      <Webcam setFileToUpload={(file) => setFilesToUpload([file])} />
    </>
  )
}

export default NoteFileUploadArea
