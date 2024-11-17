import { FC, useState } from 'react'
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Checkbox,
  Container,
  Flex,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react'
import { inferRouterInputs } from '@trpc/server'
import { BIG_CONTAINER_WIDTH, BORDER_RADIUS } from 'constants/constants'
import { omit } from 'lodash'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import { EasyForm } from 'components'

type CreateAccessRequest =
  inferRouterInputs<AppRouter>['accessRequest']['createAccessRequest']

const RequestAccess: FC = () => {
  const { back } = useStyle()
  const toast = useToast()
  const [requestAccessSucceeded, setRequestAccessSucceeded] = useState(false)

  const createAccessRequest = api.accessRequest.createAccessRequest.useMutation(
    {
      onSuccess: () => {
        setRequestAccessSucceeded(true)
        toast({
          title: 'Your request has been sent',
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
      },
      onError: (error) => {
        toast({
          title: 'Something went wrong.',
          description: error.message,
          status: 'error',
          duration: 6000,
          isClosable: true,
        })
      },
    },
  )

  const onSubmit = (
    values: Partial<CreateAccessRequest & { acceptingTermsOfService: boolean }>,
    cb: () => void,
  ) => {
    if (!values.acceptingTermsOfService) {
      toast({
        title: 'Please accept the terms of service',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      cb()
      return
    }
    if (!values.email || !values.fullName) {
      toast({
        title: 'Please fill out all required fields',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      cb()
      return
    }
    createAccessRequest.mutate(
      omit(values, ['acceptingTermsOfService']) as CreateAccessRequest,
    )
    cb()
  }

  return (
    <Box bg={back} id='request-access'>
      <Container maxWidth={BIG_CONTAINER_WIDTH} pb={32}>
        <Center mb={16} pt={32}>
          <Heading>Request Access</Heading>
        </Center>
        <Container>
          {!requestAccessSucceeded ? (
            <EasyForm<
              CreateAccessRequest & { acceptingTermsOfService: boolean }
            >
              loading={createAccessRequest.isLoading}
              disableAutoFocus
              config={{
                email: {
                  label: 'Email',
                  kind: 'input',
                  placeholder: 'Enter email',
                },
                fullName: {
                  label: 'Full name',
                  kind: 'input',
                  placeholder: 'Enter name',
                },
                institution: {
                  label: 'Organization',
                  kind: 'input',
                  placeholder: 'Enter organization',
                  optional: true,
                },
                intendedUse: {
                  label: 'Purpose',
                  kind: 'textarea',
                  placeholder: 'Please describe the purpose of your project',
                },
                acceptingTermsOfService: {
                  kind: 'custom',
                  renderFn: (formik) => {
                    return (
                      <>
                        <Text mb={2} mt={2} fontWeight='bold'>
                          Terms of service
                        </Text>
                        <Flex>
                          <Checkbox
                            checked={formik.values.acceptingTermsOfService}
                            onChange={(e) => {
                              formik.setFieldValue(
                                'acceptingTermsOfService',
                                e.target.checked,
                              )
                            }}
                          />
                          <Text ml={2}>
                            I have read and accept the{' '}
                            <Text
                              display='inline'
                              as='a'
                              href='/privacy-policy'
                              target='_blank'
                              rel='noreferrer'
                              _hover={{
                                textDecoration: 'underline',
                              }}
                              color='blue.500'
                            >
                              terms of service
                            </Text>
                          </Text>
                        </Flex>
                      </>
                    )
                  },
                },
              }}
              submitButtonText={'Request access'}
              onSubmit={onSubmit}
            />
          ) : (
            <Center>
              <Alert status='success' borderRadius={BORDER_RADIUS}>
                <AlertIcon />
                Your request has been sent. We will get back to you as soon as
                possible.
              </Alert>
            </Center>
          )}
        </Container>
      </Container>
    </Box>
  )
}

export default RequestAccess
