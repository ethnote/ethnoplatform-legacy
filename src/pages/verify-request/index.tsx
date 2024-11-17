import { FC, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import { EmailIcon } from '@chakra-ui/icons'
import { BORDER_RADIUS } from 'constants/constants'

import { Layout } from 'layouts'
import { useStyle } from 'hooks/useStyle'
import { DividerWithText, LogoBlack, LogoWhite } from 'components'

const Signin: FC<NextPage> = () => {
  const { colorMode } = useColorMode()
  const { bg } = useStyle()
  const { push } = useRouter()
  const [input, setInput] = useState('')

  const onInsertLinkClicked = async () => {
    if (typeof window !== 'undefined') return
    const link = await navigator.clipboard.readText()
    push(link)
  }

  return (
    <Layout pageTitle='Verify Email'>
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
          <Text textAlign='center' my={2}>
            An email has been sent to you. Click on the link to verify your
            email and sign in. If you don&apos;t see the email, check your spam
            folder.
          </Text>
          <EmailIcon opacity={0.3} fontSize='40' />
          <Button mt={4} onClick={onInsertLinkClicked}>
            Insert from clipboard
          </Button>
          <Box w={64} mt={2}>
            <DividerWithText text='or insert link' mb={2} />
          </Box>
          <Flex gap={2}>
            <Input value={input} onChange={(e) => setInput(e.target.value)} />
            <Button onClick={() => push(input)}>Go</Button>
          </Flex>
        </Flex>
      </Center>
    </Layout>
  )
}

export default Signin
