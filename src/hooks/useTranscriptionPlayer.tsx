import {
  createContext,
  FC,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  IconButton,
  Kbd,
  Text,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import { isMacOs } from 'react-device-detect'
import { FaPause, FaPlay } from 'react-icons/fa'
import { IoChevronUp, IoCloseSharp, IoRemove } from 'react-icons/io5'
import ReactPlayer from 'react-player/lazy'

import { useKeyPress } from './useKeyPress'
import { useStyle } from './useStyle'

type State = {
  mediaUrl: string | null
  setMediaUrl: (audioUrl: string | null, mimeType?: string) => void
}

const defaultValue: State = {
  mediaUrl: null,
  setMediaUrl: () => null,
}

export const TranscriptionPlayerContext = createContext<State>(defaultValue)
export const useTranscriptionPlayer = (): State =>
  useContext(TranscriptionPlayerContext)

type TranscriptionPlayerProviderProps = {
  children: ReactElement
}

export const TranscriptionPlayerProvider: FC<
  TranscriptionPlayerProviderProps
> = (p) => {
  const [mediaUrl, _setMediaUrl] = useState<string | null>(null)
  const [isVideo, setIsVideo] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isSlow, setIsSlow] = useState<boolean>(false)
  const [isMinimized, setIsMinimized] = useState<boolean>(false)
  const playerRef = useRef<ReactPlayer>(null)

  const { bg } = useStyle()

  const seekDeltaSeconds = (delta: number) => {
    playerRef.current?.seekTo(playerRef.current?.getCurrentTime() + delta)
  }

  const setMediaUrl = (mediaUrl: string | null, mimeType?: string) => {
    if (!mediaUrl) {
      _setMediaUrl(null)
      return
    }
    mimeType && setIsVideo(mimeType.startsWith('video'))
    _setMediaUrl(mediaUrl)
  }

  return (
    <TranscriptionPlayerContext.Provider
      value={{
        mediaUrl,
        setMediaUrl,
      }}
    >
      {p.children}
      {mediaUrl && (
        <KeyPressListener
          seekDeltaSeconds={seekDeltaSeconds}
          togglePlayPause={() => setIsPlaying(!isPlaying)}
          toggleIsSlow={() => setIsSlow(!isSlow)}
        />
      )}
      {mediaUrl && (
        <Box
          position='fixed'
          left={3}
          bottom={4}
          w='400px'
          maxW='90vw'
          bg={bg}
          borderWidth={1}
          borderRadius={BORDER_RADIUS}
        >
          <Flex justifyContent='space-between' alignItems='center' pl={4}>
            <Text>
              Mini Player{' '}
              <Text display='inline-block' opacity={0.5}>
                {isPlaying ? 'Playing' : 'Paused'}
              </Text>
            </Text>
            <Flex my={1} mr={1}>
              <IconButton
                variant='ghost'
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label='Minimize'
                icon={!isMinimized ? <IoRemove /> : <IoChevronUp />}
              />
              <IconButton
                variant='ghost'
                aria-label='Close'
                onClick={() => setMediaUrl(null)}
                icon={<IoCloseSharp />}
              />
            </Flex>
          </Flex>
          <Box h={isMinimized ? 0 : undefined}>
            <Flex minH='100px' maxH='40vh'>
              <Center mb={4} w='100%' px={isVideo ? 0 : 4}>
                <ReactPlayer
                  ref={playerRef}
                  url={mediaUrl}
                  playbackRate={isSlow ? 0.5 : 1}
                  height={isVideo ? '100%' : '50px'}
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playing={isPlaying}
                />
              </Center>
            </Flex>
            <ButtonGroup
              size='sm'
              variant='outline'
              w='100%'
              px={2}
              spacing={1}
            >
              <Box w='100%'>
                <Button
                  onClick={() => {
                    seekDeltaSeconds(-5)
                  }}
                  w='100%'
                >
                  -5 s
                </Button>
                <Shortcut keyboardKey='1' />
              </Box>
              <Box w='100%'>
                <IconButton
                  onClick={() => {
                    setIsPlaying(!isPlaying)
                  }}
                  w='100%'
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  icon={isPlaying ? <FaPause /> : <FaPlay />}
                />
                <Shortcut keyboardKey='2' />
              </Box>
              <Box w='100%'>
                <Button
                  onClick={() => {
                    seekDeltaSeconds(5)
                  }}
                  w='100%'
                >
                  +5 s
                </Button>
                <Shortcut keyboardKey='3' />
              </Box>
              <Box w='100%'>
                <Button
                  onClick={() => {
                    setIsSlow(!isSlow)
                  }}
                  w='100%'
                  variant={isSlow ? 'solid' : 'outline'}
                >
                  Slow
                </Button>
                <Shortcut keyboardKey='4' />
              </Box>
            </ButtonGroup>
          </Box>
        </Box>
      )}
    </TranscriptionPlayerContext.Provider>
  )
}

const Shortcut = ({ keyboardKey }: { keyboardKey: string }) => (
  <Center mb={2} mt={1}>
    <Text fontSize='sm' opacity={0.5}>
      <Kbd>{isMacOs ? '⌘' : 'ctrl'}</Kbd> + <Kbd>{keyboardKey}</Kbd>
    </Text>
  </Center>
)

type KeyPressListenerProps = {
  seekDeltaSeconds: (delta: number) => void
  togglePlayPause: () => void
  toggleIsSlow: () => void
}

const KeyPressListener = ({
  seekDeltaSeconds,
  togglePlayPause,
  toggleIsSlow,
}: KeyPressListenerProps) => {
  const back5Seconds = useKeyPress('mod+1')
  const playPause = useKeyPress('mod+2')
  const forward5Seconds = useKeyPress('mod+3')
  const slowDown = useKeyPress('mod+4')

  useEffect(() => {
    if (back5Seconds) {
      seekDeltaSeconds(-5)
    }
  }, [back5Seconds])

  useEffect(() => {
    if (playPause) {
      togglePlayPause()
    }
  }, [playPause])

  useEffect(() => {
    if (forward5Seconds) {
      seekDeltaSeconds(5)
    }
  }, [forward5Seconds])

  useEffect(() => {
    if (slowDown) {
      toggleIsSlow()
    }
  }, [slowDown])

  return <></>
}
