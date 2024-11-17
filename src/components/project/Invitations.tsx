import { FC } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Text,
  useToast,
} from '@chakra-ui/react'
import moment from 'moment'

import { api } from 'utils/api'
import { ContentBox } from 'components'

const Invitations: FC = () => {
  const utils = api.useContext()
  const { data: me } = api.me.me.useQuery()
  const toast = useToast()

  const acceptInvitation = api.project.acceptInvitation.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while accepting invitation',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully accepted invitation`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.me.invalidate()
    },
  })

  const declineInvitation = api.project.declineInvitation.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while sending invitation',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Declined invitation`,
        status: 'info',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.me.invalidate()
    },
  })

  if (!me) return null

  const invitations = me.invitations.map((i) => ({
    id: i.id,
    projectName: i.project?.name,
    sent: i.invitationSentAt,
  }))

  if (invitations.length === 0) return null

  return (
    <ContentBox title='Invitations'>
      {invitations?.map((invitation, i) => {
        return (
          <Flex key={i} justifyContent='space-between' alignItems='center'>
            <Box>
              <Text fontWeight='bold'>{invitation.projectName}</Text>{' '}
              <Text>
                {moment(invitation.sent).format('MMMM DD, YYYY HH:mm:ss')}
              </Text>
            </Box>
            <ButtonGroup>
              <Button
                onClick={() =>
                  declineInvitation.mutate({
                    membershipToDecline: invitation.id,
                  })
                }
              >
                Decline
              </Button>
              <Button
                onClick={() =>
                  acceptInvitation.mutate({
                    membershipToAccept: invitation.id,
                  })
                }
                colorScheme='green'
              >
                Accept
              </Button>
            </ButtonGroup>
          </Flex>
        )
      })}
    </ContentBox>
  )
}

export default Invitations
