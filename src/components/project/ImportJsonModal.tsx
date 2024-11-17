import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Center, Spinner, Text, useToast } from '@chakra-ui/react'

import { api } from 'utils/api'
import { FileUploadArea, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const ImportJsonModal: FC<Props> = (p) => {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const utils = api.useContext()
  const toast = useToast()
  const { push } = useRouter()

  const importJson = api.project.importJson.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while importing JSON',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      setIsLoading(false)
    },
    onSuccess({ name, handle }) {
      toast({
        title: `Successfully imported ${name} from JSON`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      utils.me.me.invalidate()
      setIsLoading(false)
      push(`/projects/${handle}/notes`)
    },
  })

  useEffect(() => {
    setIsLoading(false)
  }, [p.isOpen])

  const uploadFiles = (files: File[]): void => {
    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result
      importJson.mutate({
        jsonString: text as string,
      })
    }

    files[0] && reader.readAsText(files[0])
  }

  return (
    <Modal isOpen={p.isOpen} onClose={p.onClose} title='Import JSON' size='2xl'>
      <Text mt={4}>
        Upload a project JSON export (single file). This will create a new
        project with the notes. Files will not be included.
      </Text>
      <Box my={4}>
        {!isLoading ? (
          <FileUploadArea
            error={error}
            setError={setError}
            uploadFiles={uploadFiles}
            supporedMimeTypes={['application/json']}
            isUploading={false}
            maxFileSize={10 * 1024 * 1024}
          />
        ) : (
          <Center>
            <Spinner />
          </Center>
        )}
      </Box>
    </Modal>
  )
}

export default ImportJsonModal
