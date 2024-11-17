import { FC } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  useToast,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import * as Yup from 'yup'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type TransferTo = {
  email: string
}

const TransferProjectModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()

  const requestTransfer = api.me.requestTransferAllProjects.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while sending invitation',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess({ toEmail }) {
      toast({
        title: `Successfully sent invitation to ${toEmail}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.me.me.invalidate()
    },
  })

  const onSubmit = (value: Partial<TransferTo>) => {
    if (!value.email) return
    requestTransfer.mutate({
      toEmail: value.email.toLocaleLowerCase(),
    })
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Transfer All Projects'
      size='2xl'
    >
      <Box mb={4}>
        <Alert
          borderRadius={BORDER_RADIUS}
          mb={4}
          mt={8}
          status='error'
          justifyContent='space-between'
        >
          <AlertIcon />
          <AlertDescription>
            By transfering all your projects to the new user, all your notes,
            comments and notifications will also be transfered.
          </AlertDescription>
        </Alert>
        <EasyForm<TransferTo>
          loading={requestTransfer.isLoading}
          config={{
            email: {
              kind: 'input',
              label:
                'Email of the user you want to transfer all your projects to',
              placeholder: 'example@email.com',
            },
          }}
          yupSchema={{
            email: Yup.string().email('Invalid email'),
          }}
          submitButtonText={'Send Invitation'}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default TransferProjectModal
