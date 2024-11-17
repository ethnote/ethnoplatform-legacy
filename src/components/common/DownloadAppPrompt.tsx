import { FC, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Image,
  Portal,
  Text,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import { isAndroid, isIOS } from 'react-device-detect'
import { AiOutlineCheckCircle, AiOutlineCloudDownload } from 'react-icons/ai'
import { BsThreeDotsVertical } from 'react-icons/bs'
import { MdOutlineIosShare } from 'react-icons/md'
import { VscDiffAdded } from 'react-icons/vsc'

import { useGlobalState } from 'hooks/useGlobalState'
import { useStyle } from 'hooks/useStyle'
import ButtonVariant from './ButtonVariant'

type Props = {
  param?: string
}

const DownloadAppPrompt: FC<Props> = () => {
  const [downloadPressed, setDownloadPressed] = useState(false)
  const { didAskToDownload, setDidAskToDownload, isStandalone } =
    useGlobalState()

  const { bg } = useStyle()

  const setDidAskAndClose = () => {
    window.localStorage.setItem('didAsk', 'true')
    setDidAskToDownload(true)
    setDownloadPressed(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.current = e
    })
  }, [])

  const prompt = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      deferredPrompt.current.prompt()
    } catch (e) {
      console.log(e)
    }
    // Find out whether the user confirmed the installation or not
  }

  const IosGuide = () => {
    return (
      <Flex w='100%' flexDir='column' px={2} pt={2} gap={2}>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <MdOutlineIosShare />
          </Box>
          <Text>1. Tap share</Text>
        </Flex>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <VscDiffAdded />
          </Box>
          <Text>2. Tap &quot;Add to Home Screen&quot;</Text>
        </Flex>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <AiOutlineCheckCircle />
          </Box>
          <Text>3. Tap &quot;Add&quot;</Text>
        </Flex>
      </Flex>
    )
  }

  const AndroidGuide = () => {
    return (
      <Flex w='100%' flexDir='column' px={2} pt={2} gap={2}>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <BsThreeDotsVertical />
          </Box>
          <Text>1. Tap the three dots</Text>
        </Flex>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <VscDiffAdded />
          </Box>
          <Text>2. Tap &quot;Add to Home Screen&quot;</Text>
        </Flex>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <AiOutlineCheckCircle />
          </Box>
          <Text>3. Tap &quot;Add&quot;</Text>
        </Flex>
      </Flex>
    )
  }

  const PromptWeb = () => {
    return (
      <Flex w='100%' flexDir='column' px={2} pt={2} gap={2}>
        <Flex alignItems='center'>
          <Box minW='30px' maxW='30px'>
            <AiOutlineCheckCircle />
          </Box>
          <Text>Click &quot;Install&quot;</Text>
        </Flex>
      </Flex>
    )
  }

  const Prompt = () => {
    return (
      <Flex gap={4} w='100%'>
        <Flex h='100%' alignItems='center'>
          <Box borderWidth={1} borderRadius={BORDER_RADIUS}>
            <Image
              alt=''
              minH='50px'
              minW='50px'
              maxH='50px'
              maxW='50px'
              src='/android-chrome-192x192.png'
            />
          </Box>
        </Flex>
        <Flex w='100%' flexDir='column'>
          <Text fontSize={18} fontWeight='bold'>
            Add to Home screen
          </Text>
          <Text>Download the app for easier access</Text>
        </Flex>
      </Flex>
    )
  }

  if (
    didAskToDownload ||
    didAskToDownload === null ||
    isStandalone === null ||
    isStandalone
  )
    return null

  return (
    <Portal>
      <Box
        maxW='720px'
        w='94%'
        px={10}
        bg={bg}
        position='fixed'
        bottom={2}
        left='50%'
        transform='translateX(-50%)'
        borderRadius={BORDER_RADIUS}
        p={4}
        borderWidth={1}
        boxShadow='2xl'
      >
        <Flex
          gap={2}
          justifyContent='space-between'
          alignItems='center'
          flexDir={{
            base: 'column',
            md: 'row',
          }}
          w='100%'
        >
          {downloadPressed ? (
            isAndroid ? (
              <AndroidGuide />
            ) : isIOS ? (
              <IosGuide />
            ) : (
              <PromptWeb />
            )
          ) : (
            <Prompt />
          )}
          <Flex
            w={{
              base: '100%',
              md: 'auto',
            }}
            justifyContent='flex-end'
          >
            <ButtonGroup
              mt={{
                base: 3,
                md: 0,
              }}
              w={{
                base: '100%',
                md: 'auto',
              }}
            >
              <Button
                w={{
                  base: '100%',
                  md: 'auto',
                }}
                variant='ghost'
                onClick={setDidAskAndClose}
              >
                Close
              </Button>
              {!downloadPressed && (
                <ButtonVariant
                  w={{
                    base: '100%',
                    md: 'auto',
                  }}
                  colorScheme='blue'
                  leftIcon={<AiOutlineCloudDownload />}
                  onClick={() => {
                    prompt()
                    setDownloadPressed(true)
                  }}
                >
                  Download
                </ButtonVariant>
              )}
            </ButtonGroup>
          </Flex>
        </Flex>
      </Box>
    </Portal>
  )
}

export default DownloadAppPrompt
