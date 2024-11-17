import { FC } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import * as Yup from 'yup'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type Props = {
  fileId: string | null
  isOpen: boolean
  onClose: () => void
  initialValues: UpdateNote
}

export type UpdateNote = {
  name: string
  caption?: string
}

const RenameFileModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()

  const updateFile = api.note.updateFile.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while updating the file',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully updated file`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.note.note.invalidate()
    },
  })

  const onSubmit = (value: Partial<UpdateNote>) => {
    if (!value.name || !p.fileId) return
    updateFile.mutate({
      id: p.fileId,
      name: value.name,
      caption: value.caption,
    })
  }

  return (
    <Modal isOpen={p.isOpen} onClose={p.onClose} title='Edit File' size='2xl'>
      <Box mb={4}>
        <EasyForm<UpdateNote>
          loading={updateFile.isLoading}
          initialValues={p.initialValues}
          config={{
            name: {
              kind: 'input',
              label: 'Name',
            },
            caption: {
              kind: 'textarea',
              label: 'Caption',
              optional: true,
            },
          }}
          yupSchema={{
            name: Yup.string().required('Name is required'),
            caption: Yup.string()
              .optional()
              .max(255, 'Caption is too long, max 255 characters'),
          }}
          submitButtonText={'Update'}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default RenameFileModal
