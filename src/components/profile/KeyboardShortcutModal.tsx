import { FC, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Input,
  Kbd,
  Text,
  useToast,
} from '@chakra-ui/react'
import { isMacOs } from 'react-device-detect'

import { api } from 'utils/api'
import { Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  currentKeyboardCode: string
}

const KeyboardShortcutModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const [keyCode, setKeyCode] = useState(p.currentKeyboardCode || 'enter')

  const updateTimestampShortcut = api.me.updateUser.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while updating timestamp shortcut',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully updated timestamp shortcut`,
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

  const onSubmit = () => {
    if (!keyCode) return
    updateTimestampShortcut.mutate({
      timestampShortcutCode: keyCode,
    })
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Shortcut for timestamp in fieldnote text editor'
      size='2xl'
    >
      <Box mb={4}>
        <Text mb={4}>
          Click on the keyboard key you want to use as a shortcut togehther with{' '}
          {isMacOs ? 'cmd' : 'ctrl'}.
        </Text>
        <Center>
          <span>
            <Kbd>{isMacOs ? 'cmd' : 'ctrl'}</Kbd> +{' '}
            <Input
              autoFocus
              w={32}
              display='inline-block'
              placeholder={p.currentKeyboardCode}
              value={keyCode}
              onKeyDown={(e) => {
                e.preventDefault()
                if (e.key === 'Meta' || e.key === 'Control') return
                setKeyCode(e.key === ' ' ? 'space' : e.key.toLocaleLowerCase())
              }}
            />
          </span>
        </Center>
        <Flex w='100%' justifyContent='flex-end'>
          <ButtonGroup mt={4}>
            <Button onClick={p.onClose}>Close</Button>
            <Button onClick={onSubmit} colorScheme='blue'>
              Save
            </Button>
          </ButtonGroup>
        </Flex>
      </Box>
    </Modal>
  )
}

export default KeyboardShortcutModal
