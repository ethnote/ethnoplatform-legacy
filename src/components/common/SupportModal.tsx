import { FC } from 'react'
import { useRouter } from 'next/router'
import { Box, useToast } from '@chakra-ui/react'
import {
  browserName,
  browserVersion,
  deviceType,
  mobileModel,
  mobileVendor,
  osName,
  osVersion,
} from 'react-device-detect'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type NewNote = {
  message: string
}

const SupportModal: FC<Props> = (p) => {
  const toast = useToast()
  const { data: me } = api.me.me.useQuery()
  const { asPath } = useRouter()

  const sendSupportMessage = api.me.supportMessage.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while sending your message',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully sent message`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
  })

  const onSubmit = (value: Partial<NewNote>) => {
    if (!value.message) return
    sendSupportMessage.mutate({
      body:
        value.message +
        '\n\n' +
        JSON.stringify({
          mobileVendor,
          osName,
          osVersion,
          browserName,
          browserVersion,
          mobileModel,
          deviceType,
          windowWidth: window.screen.width,
          windowHeight: window.screen.height,
          currentPath: asPath,
        }),
    })
  }

  const extra =
    typeof window !== 'undefined'
      ? `To make it easier for us to help you, we'll include the following information in your message:

email: ${me?.email},
OS: ${osName} ${osVersion},
browser: ${browserName} ${browserVersion} (${deviceType}),
device: ${mobileVendor} ${mobileModel},
screen size: ${window.screen.width} x ${window.screen.height},
current path: ${asPath}.`
      : ''

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Do you experience a problem? Please report it here'
      size='2xl'
    >
      <Box mb={4} mt={8}>
        <EasyForm<NewNote>
          loading={sendSupportMessage.isLoading}
          config={{
            message: {
              kind: 'textarea',
              label: 'Message',
              // helpText: extra,
              description: 'Please describe the problem you experience.',
            },
          }}
          submitButtonText={'Send message'}
          onSubmit={(values) => {
            onSubmit(values)
          }}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default SupportModal
