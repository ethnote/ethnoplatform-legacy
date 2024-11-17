import { FC, useCallback, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  useToast,
} from '@chakra-ui/react'
import { Select } from 'chakra-react-select'
import { BORDER_RADIUS } from 'constants/constants'
import { debounce } from 'lodash'
import * as Yup from 'yup'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  transferFromEmail: string | null
}

type TransferTo = {
  email: string
  confirmEmail: string
}

const TransferProjectBetweenUsersModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const [searchWord, setSearchWord] = useState<string>('')

  const { data: users, isLoading } =
    api.superAdmin.searchForUserEmails.useQuery({
      searchWord,
    })

  const transferProjects = api.superAdmin.transferProjects.useMutation({
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
        title: `Successfully transfered all projects to ${toEmail}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.superAdmin.allUsers.invalidate()
    },
  })

  const onSubmit = async (value: Partial<TransferTo>, cb: () => void) => {
    if (!value.email) {
      toast({
        title: 'Please select a user to transfer projects to',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      return cb()
    }

    if (value.confirmEmail !== p.transferFromEmail) {
      toast({
        title: 'Confirm email does not match',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      return cb()
    }

    await transferProjects.mutateAsync({
      toEmail: value.email,
      fromEmail: p.transferFromEmail,
    })

    cb()
  }

  const onInputChange = useCallback(
    debounce((value) => {
      setSearchWord(value)
    }, 300),
    [],
  )

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Transfer Projects'
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
            By transfering all the projects from {p.transferFromEmail} to
            another user, all the notes, comments and notifications will also be
            transfered.
          </AlertDescription>
        </Alert>
        <EasyForm<TransferTo>
          loading={false}
          config={{
            email: {
              kind: 'custom',
              renderFn: (formik) => {
                return (
                  <Select
                    options={users
                      ?.map((u) => ({
                        label: u.email,
                        key: u.email,
                      }))
                      .filter((u) => u.key !== p.transferFromEmail)}
                    placeholder='Select user to transfer projects to...'
                    onInputChange={(value) => onInputChange(value)}
                    isLoading={isLoading}
                    isClearable
                    onChange={(value) =>
                      formik.setFieldValue('email', value?.key)
                    }
                  />
                )
              },
            },
            confirmEmail: {
              kind: 'input',
              label: 'Confirm Transfer From Email',
              type: 'email',
              placeholder: p.transferFromEmail || '',
            },
          }}
          yupSchema={{
            email: Yup.string().email('Invalid email'),
          }}
          submitButtonText={'Transfer Projects'}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default TransferProjectBetweenUsersModal
