import { FC } from 'react'
import Image from 'next/image'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Heading,
  HStack,
  Link,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { BIG_CONTAINER_WIDTH, BLUE_GRADIENT } from 'constants/constants'
import { motion, useTransform, useViewportScroll } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { AiOutlineForm } from 'react-icons/ai'
import { BiRocket } from 'react-icons/bi'
import { IoCloudOfflineOutline, IoDocumentTextOutline } from 'react-icons/io5'

import { useIsOnline } from 'hooks/useIsOnline'
import ButtonVariant from 'components/common/ButtonVariant'

const Hero: FC = () => {
  const opacity = useColorModeValue(0.03, 1)
  const appWindowPath = useColorModeValue(
    '/ethnote_window_light.png',
    '/ethnote_window.png',
  )
  const { data: session } = useSession()
  const { isOnline } = useIsOnline()
  const { scrollYProgress } = useViewportScroll()
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.7])

  const scrollToRequestAccess = () => {
    const element = document.getElementById('request-access')
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    })
  }

  return (
    <Box position='relative' h='700px'>
      <Box
        bgImage='/bg.png'
        bgRepeat={'no-repeat'}
        bgSize={'cover'}
        opacity={opacity}
        position='absolute'
        top={0}
        left={0}
        right={0}
        bottom={0}
      />
      <Container
        maxWidth={BIG_CONTAINER_WIDTH}
        position='absolute'
        top={0}
        left={0}
        right={0}
        bottom={0}
      >
        <HStack
          h='700px'
          flexDir={{
            base: 'column',
            md: 'row',
          }}
        >
          <Flex flexDir='column' w='100%'>
            <Heading fontSize={42}>Open Source Collaborative </Heading>
            <Heading fontSize={42}>
              <Text
                display='inline-block'
                bgGradient={BLUE_GRADIENT}
                bgClip='text'
              >
                Notes
              </Text>{' '}
              in the Cloud
            </Heading>
            <Text>Your team&apos;s notes collected in one place</Text>
            <ButtonGroup mt={8} alignItems='center'>
              {!isOnline ? (
                <Link href='/quick-notes'>
                  <ButtonVariant leftIcon={<IoCloudOfflineOutline />}>
                    Go to quick notes
                  </ButtonVariant>
                </Link>
              ) : !!session ? (
                <Link href='/projects'>
                  <ButtonVariant leftIcon={<BiRocket />}>
                    Go to app
                  </ButtonVariant>
                </Link>
              ) : (
                <>
                  <ButtonVariant
                    leftIcon={<AiOutlineForm />}
                    variant='outline'
                    colorScheme='blue'
                    onClick={scrollToRequestAccess}
                  >
                    Request access
                  </ButtonVariant>
                </>
              )}
              <Button leftIcon={<IoDocumentTextOutline />} variant='solid'>
                Read the paper
              </Button>
            </ButtonGroup>
          </Flex>
          <Flex
            justifyContent='flex-end'
            position='relative'
            mr={8}
            w='100%'
            h='75%'
          >
            <Box
              position='absolute'
              top={'5%'}
              bottom='5%'
              left={'10.5%'}
              right={'10.5%'}
            >
              <Image
                width={960}
                height={500}
                alt='mac screen'
                src='/mac_bg.webp'
              />
            </Box>
            <Box position='absolute' top={0} left={0} bottom={0} right={0}>
              <Image
                width={960}
                height={500}
                alt='mac screen'
                src='/mac_transparent_screen.webp'
              />
            </Box>
            <Box
              position='absolute'
              top={0}
              left={0}
              bottom={0}
              right={0}
              transform='scale(0.7) translateY(-14.7%)'
            >
              <motion.div
                className='container'
                style={{
                  scale,
                }}
              >
                <Image
                  width={960}
                  height={500}
                  alt='mac screen'
                  src={appWindowPath}
                />
              </motion.div>
            </Box>
          </Flex>
        </HStack>
      </Container>
    </Box>
  )
}

export default Hero
