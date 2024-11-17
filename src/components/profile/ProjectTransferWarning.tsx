import { FC } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  useToast,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'

import { api } from 'utils/api'

type Props = {
  toEmail: string
}

const ProjectTransferWarning: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()

  const cancelTransferAllProjects =
    api.me.cancelTransferAllProjects.useMutation({
      onError(err) {
        toast({
          title: 'An error occurred while canceling project transfer',
          description: err.message,
          status: 'error',
          duration: 6000,
          isClosable: true,
        })
      },
      onSuccess() {
        toast({
          title: 'Successfully canceled project transfer',
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
      },
      onSettled() {
        utils.me.me.invalidate()
      },
    })

  return (
    <Alert
      borderRadius={BORDER_RADIUS}
      mb={4}
      status='error'
      justifyContent='space-between'
    >
      <Flex alignItems='center'>
        <AlertIcon />
        <Box>
          <AlertTitle>Project Transfer</AlertTitle>
          <AlertDescription>
            You have a pending project transfer invitation sent to {p.toEmail}.
          </AlertDescription>
        </Box>
      </Flex>
      <Button onClick={() => cancelTransferAllProjects.mutate()}>
        Cancel invitation
      </Button>
    </Alert>
  )
}

export default ProjectTransferWarning
