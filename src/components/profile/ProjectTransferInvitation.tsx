import { FC } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  Flex,
  useToast,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'

import { api } from 'utils/api'

type Props = {
  id: string
  fromEmail: string | null | undefined
}

const ProjectTransferInvitation: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const id = p.id

  const accept = api.me.acceptTransferAllProjects.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while accepting project transfer',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: 'Successfully accepted project transfer',
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.me.me.invalidate()
      utils.project.project.invalidate()
    },
  })
  const decline = api.me.declineTransferAllProjects.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while declining project transfer',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: 'Successfully declined project transfer',
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
      status='warning'
      justifyContent='space-between'
    >
      <Flex alignItems='center'>
        <AlertIcon />
        <Box>
          <AlertTitle>Project Transfer</AlertTitle>
          <AlertDescription>
            {p.fromEmail} has invited you to take over their projects.
          </AlertDescription>
        </Box>
      </Flex>
      <ButtonGroup>
        <Button onClick={() => decline.mutate({ id })}>Decline</Button>
        <Button
          isLoading={accept.isLoading}
          onClick={() => accept.mutate({ id })}
        >
          Accept
        </Button>
      </ButtonGroup>
    </Alert>
  )
}

export default ProjectTransferInvitation
