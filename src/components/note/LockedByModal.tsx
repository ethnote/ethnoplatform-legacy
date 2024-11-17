import { FC } from 'react'
import { Box, Button, ButtonGroup, Flex, Text } from '@chakra-ui/react'

import { Avatar, Modal } from 'components'

type Props = {
  isOpen: boolean
  lockedByName?: string | null | undefined
  onTakeOverClick: () => void
  onReadOnlyClick: () => void
  lockedByHue?: number | null
  overwriteName?: string
}

const LockedByModal: FC<Props> = (p) => {
  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onReadOnlyClick}
      title={`This ${p.overwriteName ?? 'fieldnote'} is currently locked`}
      size='2xl'
    >
      <Box mb={4}>
        <Flex my={8} alignItems='center' gap={4}>
          <Avatar size='lg' name={p.lockedByName} hue={p.lockedByHue} />
          <Text>
            This {p.overwriteName ?? 'fieldnote'} is currently being edited by{' '}
            {p.lockedByName}. By taking over the session, you will be able to
            edit the {p.overwriteName ?? 'fieldnote'} and the other user will be
            kicked out of the session.
          </Text>
        </Flex>
        <Flex justifyContent='flex-end' w='100%'>
          <ButtonGroup>
            <Button onClick={p.onReadOnlyClick}>Read only</Button>
            <Button onClick={p.onTakeOverClick} colorScheme='blue'>
              Take over session
            </Button>
          </ButtonGroup>
        </Flex>
      </Box>
    </Modal>
  )
}

export default LockedByModal
