import { FC, useEffect, useState } from 'react'
import { Box, Center, Text, useToast } from '@chakra-ui/react'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type AddName = {
  fullName: string
}

const NamePrompt: FC = () => {
  const toast = useToast()
  const utils = api.useContext()
  const { data: me } = api.me.me.useQuery()
  const [isOpen, setIsOpen] = useState(false)
  const [didAskForName, setDidAskForName] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem('didAskForName')) {
      setDidAskForName(true)
    } else {
      setDidAskForName(false)
    }
  }, [])

  useEffect(() => {
    if (me && !me?.fullName && !me?.namePromptedAt && !didAskForName) {
      setIsOpen(true)
    }
  }, [me])

  const updateUser = api.me.updateUser.useMutation({
    async onMutate(updateUser) {
      await utils.me.me.invalidate()
      const prevData = utils.me.me.getData()

      // Optimistically update the data
      const newData = {
        ...prevData,
        fullName: updateUser.fullName || null,
      } as any

      utils.me.me.setData(undefined, newData)

      return { prevData }
    },
    onError(err) {
      toast({
        title: 'An error occurred.',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess({ fullName }) {
      if (fullName) {
        toast({
          title: `Successfully added your name`,
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
      }
    },
    onSettled() {
      utils.me.me.invalidate()
      utils.project.project.invalidate()
    },
  })

  const onSubmit = (value: Partial<AddName>) => {
    if (value.fullName) {
      updateUser.mutate({
        fullName: value.fullName,
        namePromptedAt: new Date(),
      })
    } else {
      updateUser.mutate({
        namePromptedAt: new Date(),
      })
    }
    setIsOpen(false)
  }

  const onClose = () => {
    setDidAskForName(true)

    updateUser.mutate({
      namePromptedAt: new Date(),
    })
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Welcome to Ethnote!'
      size='xl'
      closeOnOverlayClick={false}
      closeButton={true}
    >
      <Box mb={4}>
        <Center>
          <Text>Please add your name.</Text>
        </Center>
        <EasyForm<AddName>
          loading={updateUser.isLoading}
          config={{
            fullName: {
              kind: 'input',
              label: 'Name',
            },
          }}
          submitButtonText={'Submit'}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </Box>
    </Modal>
  )
}

export default NamePrompt
