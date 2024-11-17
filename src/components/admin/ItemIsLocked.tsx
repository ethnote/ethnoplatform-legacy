import { FC, useState } from 'react'
import {
  Button,
  Center,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useToast,
} from '@chakra-ui/react'
import { IoIosLock } from 'react-icons/io'

import { api } from 'utils/api'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import { ContentBox } from 'components'

type Props = {
  param?: string
}

const ItemIsLocked: FC<Props> = () => {
  const [otp, setOTP] = useState<string>('')
  const { setJwt } = useSuperAdminKey()
  const toast = useToast()

  const requestSuperAdminKey = api.superAdmin.requestSuperAdminKey.useMutation({
    onSuccess: () => {
      toast({
        title: 'Verification code sent to app@ehtnote.org',
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
  })

  const getSuperAdminKey = api.superAdmin.getSuperAdminKey.useMutation({
    onSuccess: () => {
      toast({
        title: 'Successfully validated',
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onError: (err) => {
      toast({
        title: 'Error validating',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
  })

  const onRequestOTPClick = () => {
    requestSuperAdminKey.mutate()
  }
  const onValidateClick = async () => {
    const { jwt } = await getSuperAdminKey.mutateAsync({
      otp,
    })

    setJwt(jwt)

    toast({
      title: 'Successfully validated',
      status: 'success',
      duration: 6000,
      isClosable: true,
    })
  }

  return (
    <ContentBox>
      <Center minH='400px'>
        <Flex flexDir='column' w='400px' alignItems='center' gap={8}>
          <IoIosLock size={50} />
          <Text textAlign='center'>
            This element is locked. Access key needed. A verification code will
            be sent to app@ethnote.org. The key will be valid for 12 hours.
          </Text>
          <Button onClick={onRequestOTPClick}>Request verification code</Button>
          <InputGroup size='md'>
            <Input
              pr='4.5rem'
              placeholder='Enter verification code'
              value={otp}
              onChange={(e) => {
                setOTP(e.target.value)
              }}
            />
            <InputRightElement width='4.5rem'>
              <Button
                h='1.75rem'
                mr={1.5}
                borderRadius={4}
                size='sm'
                onClick={onValidateClick}
                isDisabled={otp.length !== 16}
              >
                Validate
              </Button>
            </InputRightElement>
          </InputGroup>
        </Flex>
      </Center>
    </ContentBox>
  )
}

export default ItemIsLocked
