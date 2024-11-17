import { FC } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import * as Yup from 'yup'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  projectHandle: string
}

type NewMember = {
  email: string
}

const InviteMemberModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()

  const createMember = api.project.inviteMember.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while creating team member',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess({ invitationMailSentTo }) {
      toast({
        title: `Successfully sent invitation to ${invitationMailSentTo}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.project.project.invalidate()
      utils.me.me.invalidate()
    },
  })

  const onSubmit = (value: Partial<NewMember>) => {
    if (!value.email) return
    createMember.mutate({
      projectHandle: p.projectHandle,
      email: value.email.toLocaleLowerCase(),
    })
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Invite New Team Member'
      size='2xl'
    >
      <Box mb={4}>
        <EasyForm<NewMember>
          loading={createMember.isLoading}
          config={{
            email: {
              kind: 'input',
              label: 'Email',
            },
          }}
          yupSchema={{
            email: Yup.string().email('Invalid email'),
          }}
          submitButtonText={'Invite team member'}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default InviteMemberModal
