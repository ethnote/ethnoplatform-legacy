/* eslint-disable react/no-children-prop */

import { FC, useEffect, useState } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  PinInput,
  PinInputField,
  Spinner,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import { EmailIcon } from '@chakra-ui/icons'
import { BORDER_RADIUS } from 'constants/constants'
import { validate } from 'email-validator'
import { getCsrfToken, signIn, useSession } from 'next-auth/react'
import { TbSend } from 'react-icons/tb'

import { Layout } from 'layouts'
import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import { ButtonVariant, LogoBlack, LogoWhite } from 'components'

type Props = {
  csrfToken: string
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}

const Signin: FC<NextPage & Props> = ({ csrfToken }) => {
  const router = useRouter()
  const { callbackUrl } = router.query

  const { colorMode } = useColorMode()
  const { push } = useRouter()
  const [email, setEmail] = useState<string>()
  const { bg } = useStyle()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [didSendOtp, setDidSendOtp] = useState(false)
  const [otp, setOtp] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [errorLink, setErrorLink] = useState(false)

  useEffect(() => {
    if (session) {
      push('/projects')
    }
  }, [push, session])

  const requestOtp = api.me.requestOtp.useMutation()
  const validateOtp = api.me.validateOtp.useMutation({
    onSuccess: () => {
      setIsLoading(false)
      signIn('credentials', {
        callbackUrl: (callbackUrl as string) || '/projects',
        email,
        otp,
        csrfToken,
      })
    },
    onError: (err) => {
      setIsLoading(false)
      setErrorMessage(err.message)
    },
  })

  const onRequestOtpClicked = async () => {
    setIsLoading(true)
    if (!email) return
    try {
      await requestOtp.mutateAsync({ email: email.toLocaleLowerCase() })
      setDidSendOtp(true)
    } catch (err: any) {
      setErrorMessage(err.message)
      setErrorLink(true)
    }
    setIsLoading(false)
  }

  const onLogInClicked = async () => {
    if (!email || !otp) return
    setIsLoading(true)
    validateOtp.mutate({ email: email.toLocaleLowerCase(), otp })
  }

  if (session === undefined)
    return (
      <Layout pageTitle='Sign in'>
        <Center h='100svh'>
          <Spinner />
        </Center>
      </Layout>
    )
  const emailIsValid = validate(email || '')

  const onUseAnotherEmailClicked = () => {
    setEmail('')
    setOtp('')
    setDidSendOtp(false)
    setErrorMessage('')
  }

  return (
    <Layout pageTitle='Sign in'>
      <Center h='100svh'>
        <Flex
          w={96}
          bg={bg}
          alignItems='center'
          flexDir='column'
          borderRadius={BORDER_RADIUS}
          p={6}
        >
          <Flex mt={2}>
            <Box h={6} w={6} mr={2}>
              {colorMode === 'dark' ? <LogoWhite /> : <LogoBlack />}
            </Box>
            <Heading fontFamily={'Outfit Medium'} fontSize={30}>
              Ethnote
            </Heading>
          </Flex>
          <Text textAlign='center' mt={2}>
            Welcome to Ethnote.
          </Text>
          <Text textAlign='center' mb={6} mt={8} opacity={1}>
            <Text textAlign='center' color='red.500'>
              {errorMessage}
            </Text>
            {errorLink && (
              <Link href={'/#request-access'}>
                <Button my={2}>Request access</Button>
              </Link>
            )}
            <Text opacity={0.7}>
              {didSendOtp
                ? 'A verification code was sent to your email. It might take a some time to arrive. Please check your spam folder as well.'
                : 'Sign in with your email to get started.'}
            </Text>
          </Text>
          <FormControl>
            <InputGroup>
              <InputLeftElement
                pointerEvents='none'
                children={<EmailIcon color='gray.300' />}
              />
              <Input
                placeholder='Enter your email here...'
                isDisabled={didSendOtp}
                value={email}
                type='email'
                onChange={(e) => setEmail(e.target.value.toLocaleLowerCase())}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    emailIsValid && onRequestOtpClicked()
                  }
                }}
              />
            </InputGroup>
            {didSendOtp && (
              <Center w='100%' mt={3} flexDir='column'>
                <Text fontSize='sm' mb={1}>
                  Verificaiton code:
                </Text>
                <Input
                  type='text'
                  value={otp}
                  autoFocus
                  onChange={(e) =>
                    setOtp(e.target.value.trim().replace(/\D/g, ''))
                  }
                  w='100%'
                  placeholder='000000'
                />
                {/* <HStack>
                  <PinInput value={otp} onChange={(v) => setOtp(v.trim())}>
                    <PinInputField autoFocus />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onLogInClicked()
                        }
                      }}
                    />
                  </PinInput>
                </HStack> */}
              </Center>
            )}
            {!didSendOtp ? (
              <ButtonVariant
                fullWidth
                isDisabled={!emailIsValid || didSendOtp}
                rightIcon={<TbSend />}
                mt={4}
                colorScheme='blue'
                w='100%'
                type='submit'
                onClick={onRequestOtpClicked}
                isLoading={isLoading}
              >
                Send verification code
              </ButtonVariant>
            ) : (
              <>
                <ButtonVariant
                  fullWidth
                  isDisabled={otp?.length !== 6}
                  rightIcon={<TbSend />}
                  mt={4}
                  colorScheme='blue'
                  w='100%'
                  type='submit'
                  onClick={onLogInClicked}
                >
                  Log in
                </ButtonVariant>
                <Button onClick={onUseAnotherEmailClicked} mt={2} w='100%'>
                  Use another email
                </Button>
              </>
            )}
          </FormControl>
        </Flex>
      </Center>
    </Layout>
  )
}

export default Signin
