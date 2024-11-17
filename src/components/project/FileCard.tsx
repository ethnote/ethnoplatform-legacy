import { FC, useState } from 'react'
import {
  AspectRatio,
  Box,
  Center,
  Fade,
  Flex,
  GridItem,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import { filesize } from 'filesize'
import moment from 'moment'
import { Blurhash } from 'react-blurhash'
import {
  AiFillAudio,
  AiOutlineArrowRight,
  AiOutlineDelete,
  AiOutlineFilePdf,
  AiOutlineFileText,
  AiOutlineVideoCamera,
} from 'react-icons/ai'
import { BsCloudDownload, BsThreeDots } from 'react-icons/bs'
import { CgMiniPlayer } from 'react-icons/cg'
import { MdDriveFileRenameOutline } from 'react-icons/md'

import { useStyle } from 'hooks/useStyle'
import { useTranscriptionPlayer } from 'hooks/useTranscriptionPlayer'

type Props = {
  id: string
  filename: string
  size: number
  mimeType: string
  createdAt: Date
  caption?: string
  fileUrl?: string
  thumbnailUrl?: string
  blurhash?: string
  duration?: number
  noteTitle?: string
  onDownloadClicked?: () => void
  onDeleteClicked?: () => void
  onEditClicked?: () => void
  onGoToNoteClicked?: () => void
  onClick?: () => void
}

const FileCard: FC<Props> = (p) => {
  const { hoverBorderColor, darkerBg } = useStyle()
  const { setMediaUrl } = useTranscriptionPlayer()
  const isImage = p.mimeType.startsWith('image/')
  const [thumbnailDidLoad, setThumbnailDidLoad] = useState(false)
  let imageReloadCount = 0

  const Icon = () => {
    if (p.mimeType.startsWith('application/pdf')) {
      return <AiOutlineFilePdf size={30} opacity={0.5} />
    } else if (p.mimeType.startsWith('audio/')) {
      return <AiFillAudio size={30} opacity={0.5} />
    } else if (p.mimeType.startsWith('video/')) {
      return <AiOutlineVideoCamera size={30} opacity={0.5} />
    } else if (p.mimeType.startsWith('image/')) {
      return null
    } else {
      return <AiOutlineFileText size={30} opacity={0.5} />
    }
  }

  const MoreButton = () => {
    return (
      <Menu>
        <Box
          bg={isImage ? '#000000cc' : 'transparent'}
          borderRadius={BORDER_RADIUS}
        >
          <MenuButton
            as={IconButton}
            icon={<BsThreeDots />}
            aria-label='More'
            variant={isImage ? 'solid' : 'ghost'}
          />
        </Box>
        <Portal>
          <MenuList>
            {p.onDownloadClicked && (
              <MenuItem
                onClick={p.onDownloadClicked}
                icon={<BsCloudDownload />}
              >
                Download
              </MenuItem>
            )}
            {p.onEditClicked && (
              <MenuItem
                onClick={p.onEditClicked}
                icon={<MdDriveFileRenameOutline />}
              >
                Rename or add caption
              </MenuItem>
            )}
            {p.onGoToNoteClicked && (
              <MenuItem
                onClick={p.onGoToNoteClicked}
                icon={<AiOutlineArrowRight />}
              >
                Go to fieldnote
              </MenuItem>
            )}
            {p.fileUrl &&
              (p.mimeType.startsWith('video') ||
                p.mimeType.startsWith('audio')) && (
                <MenuItem
                  onClick={() => {
                    setMediaUrl(p.fileUrl!, p.mimeType)
                  }}
                  icon={<CgMiniPlayer style={{ transform: 'scaleX(-1)' }} />}
                >
                  Open in mini player
                </MenuItem>
              )}
            {p.onDeleteClicked && (
              <MenuItem onClick={p.onDeleteClicked} icon={<AiOutlineDelete />}>
                Delete
              </MenuItem>
            )}
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  const prettyDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration - minutes * 60)

    if (minutes === 0) {
      return `${seconds} sec`
    }

    return `${minutes} min ${seconds} sec`
  }

  return (
    <GridItem
      borderRadius={BORDER_RADIUS}
      borderWidth={1}
      borderColor='transparent'
      _hover={{ borderColor: hoverBorderColor }}
      cursor='pointer'
      colSpan={1}
    >
      <AspectRatio ratio={16 / 9}>
        <Flex
          flexDir='column'
          alignItems='center'
          bg={darkerBg}
          h='24'
          borderRadius={BORDER_RADIUS}
          overflow='hidden'
          position='relative'
          bgSize='cover'
          bgPosition='center'
        >
          {isImage && (
            <>
              {p.blurhash && (
                <Center
                  position='absolute'
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                >
                  <Blurhash
                    hash={p.blurhash || ''}
                    width={400}
                    height={300}
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                  />
                </Center>
              )}
              <Fade in={thumbnailDidLoad}>
                <Center
                  position='absolute'
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                >
                  <Image
                    alt=''
                    objectFit='cover'
                    w='100%'
                    onError={({ currentTarget }) => {
                      if (imageReloadCount > 20) return
                      currentTarget.onerror = null
                      currentTarget.src = p.thumbnailUrl || p.fileUrl || ''
                      imageReloadCount++
                    }}
                    src={p.thumbnailUrl || p.fileUrl}
                    onLoad={() => setThumbnailDidLoad(true)}
                  />
                </Center>
              </Fade>
            </>
          )}
          <Center p={4} h='100%'>
            <Icon />
          </Center>
          <Box
            onClick={p.onClick}
            position='absolute'
            top={0}
            left={0}
            right={0}
            bottom={0}
          />
          <Box position='absolute' bottom={1} right={1}>
            <MoreButton />
          </Box>
          {p.duration ? (
            <Box position='absolute' bottom={2} left={2} p={1}>
              <Text fontSize={12} color='white'>
                {prettyDuration(p.duration)}
              </Text>
            </Box>
          ) : null}
        </Flex>
      </AspectRatio>
      <Flex
        onClick={p.onClick}
        flexDir='column'
        alignItems='center'
        p={1}
        mt={1}
        mb={1}
      >
        <Text mb={0.5} isTruncated fontSize='sm' maxW='200px'>
          {p.filename}
        </Text>
        {p.noteTitle && (
          <Text mb={0.5} isTruncated fontSize='sm' maxW='200px'>
            From {p.noteTitle}
          </Text>
        )}
        <Text fontSize={12} opacity={0.5}>
          Size: {filesize(p.size, { base: 2, standard: 'jedec' }).toString()}
        </Text>
        <Text fontSize={12} opacity={0.5} mt={-1}>
          {moment(p.createdAt).format('MMM D, YYYY')}
        </Text>
        <Text as='span' fontSize='sm' mt={1}>
          {p.caption}
        </Text>
      </Flex>
    </GridItem>
  )
}

export default FileCard
