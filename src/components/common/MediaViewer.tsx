import { FC } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  IconButton,
  Image,
  Text,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import { useHotkeys } from 'react-hotkeys-hook'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { CgMiniPlayer } from 'react-icons/cg'
import ReactPlayer from 'react-player/lazy'
import { useSwipeable } from 'react-swipeable'

import { useTranscriptionPlayer } from 'hooks/useTranscriptionPlayer'
import { Modal } from 'components'

type Props = {
  selectedIndex?: number
  setSelectedIndex: (index: number | undefined) => void
  media: {
    url: string
    filename: string
    mimeType: string
    caption?: string | null
  }[]
}

const MediaViewer: FC<Props> = (p) => {
  const { setMediaUrl } = useTranscriptionPlayer()
  const selectedItem =
    p.selectedIndex !== undefined ? p.media[p.selectedIndex] : undefined

  const previous = () => {
    if (p.selectedIndex === undefined || p.selectedIndex === 0) return
    p.setSelectedIndex(p.selectedIndex - 1)
  }

  const next = () => {
    if (p.selectedIndex === undefined || p.selectedIndex === p.media.length - 1)
      return
    p.setSelectedIndex(p.selectedIndex + 1)
  }

  useHotkeys('left', previous)
  useHotkeys('right', next)

  const handlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: previous,
  })

  const Content = () => {
    const { url, mimeType } = selectedItem || {}
    if (!selectedItem || !mimeType || !url) return null

    if (mimeType.startsWith('image/')) {
      return (
        <Center>
          <Image alt='' borderRadius={BORDER_RADIUS} src={url} maxH='70vh' />
        </Center>
      )
    } else if (mimeType.startsWith('audio') || mimeType.startsWith('video')) {
      return (
        <Center pt={8} flexDir='column'>
          <ReactPlayer
            url={url}
            controls
            width='100%'
            height={mimeType.startsWith('video') ? '70vh' : '100px'}
          />
          <Button
            mt={4}
            mb={2}
            onClick={() => {
              setMediaUrl(url, mimeType)
              p.setSelectedIndex(undefined)
            }}
            leftIcon={<CgMiniPlayer style={{ transform: 'scaleX(-1)' }} />}
          >
            Open in mini player
          </Button>
        </Center>
      )
    } else if (mimeType === 'application/pdf') {
      return (
        <Center py={8}>
          <iframe src={url} style={{ width: '100%', height: '70vh' }} />
        </Center>
      )
    }
    return null
  }

  return (
    <Modal
      isOpen={p.selectedIndex !== undefined}
      onClose={() => p.setSelectedIndex(undefined)}
      title={selectedItem?.filename || ''}
      size='6xl'
      maxW='90vw'
    >
      <Box {...handlers}>
        <Content />
      </Box>
      <Center pb={1} pt={2}>
        <ButtonGroup>
          <IconButton
            isDisabled={p.selectedIndex === undefined || p.selectedIndex === 0}
            icon={<BsChevronLeft />}
            aria-label={'Previous'}
            onClick={previous}
          />
          <Center>
            <Text mx={5}>
              {(p.selectedIndex || 0) + 1} of {p.media.length}
            </Text>
          </Center>
          <IconButton
            isDisabled={
              p.selectedIndex === undefined ||
              p.selectedIndex === p.media?.length - 1
            }
            icon={<BsChevronRight />}
            aria-label={'Next'}
            onClick={next}
          />
        </ButtonGroup>
      </Center>
      {selectedItem?.caption ? (
        <Text pt={2} pb={2} textAlign='center'>
          {selectedItem?.caption}
        </Text>
      ) : (
        <></>
      )}
    </Modal>
  )
}

export default MediaViewer
