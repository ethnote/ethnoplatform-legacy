import { FC } from 'react'
import { Box, Checkbox, Flex, Tag, Text } from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import moment from 'moment'
import { AiOutlineFilePdf, AiOutlineLock } from 'react-icons/ai'
import { BiCommentDetail, BiMicrophone } from 'react-icons/bi'
import { BsCameraVideo, BsCardImage } from 'react-icons/bs'

import { api } from 'utils/api'
import { useGlobalState } from 'hooks/useGlobalState'
import { useStyle } from 'hooks/useStyle'
import { Avatar, HighlightText } from 'components'
import { InnerGlow } from 'components/project/ProjectCard'

type Props = {
  title: string
  createdAt: Date
  updatedAt: Date
  onClick: () => void
  createdByImageUrl?: string | null
  createdByName?: string | null
  createdByHue?: number | null
  createdByEmail?: string | null
  isFirst: boolean
  isLast: boolean
  isSelected: boolean
  onSelectToggle: () => void
  onlyVisibleToYou: boolean
  amountOfComments?: number
  amountOfPds?: number
  amountOfImages?: number
  amountOfVideos?: number
  amountOfRecordings?: number
  searchWord?: string
  templateName?: string
  tags?: string[]
  lockedByName?: string | null | undefined
  lockedByHue?: number | null | undefined
  noteHandle?: string | null | undefined
}

type NoteStat = {
  icon: JSX.Element
  value: string
}

const NoteCard: FC<Props> = (p) => {
  const { hoverBorderColor } = useStyle()
  const { isSmallScreen } = useGlobalState()

  // Prefetch note
  api.note.note.useQuery(
    {
      handle: p.noteHandle as string,
    },
    {
      enabled: !!p.noteHandle,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const stats: NoteStat[] = [
    {
      icon: <BiCommentDetail />,
      value: `${p.amountOfComments || 0}`,
    },
    {
      icon: <BiMicrophone />,
      value: `${p.amountOfRecordings || 0}`,
    },
    {
      icon: <BsCardImage />,
      value: `${p.amountOfImages || 0}`,
    },
    {
      icon: <BsCameraVideo />,
      value: `${p.amountOfVideos || 0}`,
    },
    {
      icon: <AiOutlineFilePdf />,
      value: `${p.amountOfPds || 0}`,
    },
  ]

  const Stats = () => {
    return (
      <Flex
        justifyContent={isSmallScreen ? 'flex-start' : 'flex-end'}
        alignItems='center'
        pointerEvents='none'
        opacity={0.5}
        gap={4}
      >
        {stats.map((s, i) => (
          <Flex key={i} alignItems='center' opacity={s.value === '0' ? 0.3 : 1}>
            {s.icon}
            <Text fontSize={14} ml={2} mt={'3px'}>
              {s.value}
            </Text>
          </Flex>
        ))}
      </Flex>
    )
  }

  const isNew = moment(p.createdAt).isAfter(moment().subtract(5, 'hour'))

  const LockedBy = () => {
    if (!p.lockedByName) return null
    return (
      <Flex justifyContent='center' alignItems='center' ml={1} gap={1}>
        <Avatar size='xs' name={p.lockedByName} hue={p.lockedByHue} />
        <AiOutlineLock />
      </Flex>
    )
  }

  return (
    <Box position='relative'>
      <Box
        minH={isSmallScreen ? 44 : 20}
        maxH={isSmallScreen ? 44 : 20}
        mt={p.isFirst || (p.isFirst && p.isLast) ? undefined : '-1px'}
        borderTopRadius={
          p.isFirst || (p.isFirst && p.isLast) ? BORDER_RADIUS : undefined
        }
        borderBottomRadius={
          p.isLast || (p.isFirst && p.isLast) ? BORDER_RADIUS : undefined
        }
        borderWidth={1}
        borderBottomColor={
          p.isLast || (p.isFirst && p.isLast) ? undefined : 'transparent'
        }
        position='relative'
        cursor='pointer'
        overflow='hidden'
        onClick={p.onClick}
        bg='#ffffff03'
        transition={'background-color 0.3s'}
        _hover={{
          borderColor: hoverBorderColor,
          borderBottomColor: hoverBorderColor,
          zIndex: 1,
        }}
        _active={{
          bg: '#ffffff10',
        }}
      >
        <InnerGlow size={2500} />
        <Flex
          position='absolute'
          top={0}
          left={0}
          right={0}
          bottom={0}
          pointerEvents='none'
          pl={12}
          alignItems='center'
        >
          <Avatar
            name={p.createdByName}
            src={p.createdByImageUrl ?? undefined}
            hue={p.createdByHue}
          />
          <Flex
            alignItems={isSmallScreen ? 'flex-start' : 'center'}
            flexDir={isSmallScreen ? 'column' : 'row'}
            w='100%'
          >
            <Box w='100%'>
              <Flex
                ml={4}
                alignItems={isSmallScreen ? 'flex-start' : 'center'}
                flexDir={isSmallScreen ? 'column' : 'row'}
                gap={isSmallScreen ? 1 : 1}
                maxW='100%'
              >
                <Text
                  fontFamily='Outfit Bold'
                  whiteSpace='nowrap'
                  isTruncated
                  maxW={{
                    base: '80%',
                    md: '100%',
                  }}
                >
                  {typeof p.title === 'string' && (
                    <HighlightText searchWord={p.searchWord}>
                      {p.title}
                    </HighlightText>
                  )}
                </Text>
                <LockedBy />
                {p.templateName && (
                  <Tag size='sm' colorScheme='blue'>
                    {p.templateName}
                  </Tag>
                )}
                {isNew && (
                  <Tag size='sm' colorScheme='green'>
                    New
                  </Tag>
                )}
                {p.tags?.map((t, i) => (
                  <Tag key={i} size='sm' colorScheme='blue'>
                    {t}
                  </Tag>
                ))}
                {p.onlyVisibleToYou && <Tag size='sm'>Not released yet</Tag>}
                <Text fontSize={12} opacity={0.3} whiteSpace='nowrap'>
                  Created {moment(p.createdAt).format('MMM D, YYYY HH:mm')}
                </Text>
              </Flex>
              <Text fontSize={14} opacity={0.4} ml={4} whiteSpace='nowrap'>
                By{' '}
                {typeof (p.createdByName || p.createdByEmail) === 'string' && (
                  <HighlightText searchWord={p.searchWord}>
                    {p.createdByName || p.createdByEmail}
                  </HighlightText>
                )}
              </Text>
            </Box>
            <Flex pointerEvents='none' flexDir='column' pr={6} ml={4}>
              <Flex
                alignItems='center'
                gap={2}
                justifyContent={{
                  base: 'flex-start',
                  md: 'flex-end',
                }}
              >
                <Text
                  fontSize={14}
                  opacity={0.8}
                  textAlign='right'
                  whiteSpace='nowrap'
                >
                  Last updated {moment(p.updatedAt).fromNow()}
                </Text>
              </Flex>
              <Stats />
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Flex
        position='absolute'
        top={'50%'}
        left={2.5}
        transform='translateY(-50%)'
        padding={2}
        zIndex={1}
      >
        <Checkbox
          isChecked={p.isSelected}
          onChange={() => p.onSelectToggle()}
        />
      </Flex>
    </Box>
  )
}

export default NoteCard
