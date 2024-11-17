import { FC, useRef, useState } from 'react'
import { Box, Flex, GridItem, Heading, Text } from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import moment from 'moment'
import { isMobile, isSafari } from 'react-device-detect'

import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import { Avatars, HighlightText } from 'components'

type Stat = {
  label: string
  value: string
}

type Props = {
  members?: {
    image?: string
    name?: string
    avatarHue?: number
  }[]
  createdAt: string | Date
  updatedAt: string | Date
  title: string
  subtitle?: string | null
  stats?: Stat[]
  onClick?: () => void
  searchWord?: string
  projectHandle?: string | null | undefined
}

type GlowProps = {
  size?: number
}

export const InnerGlow: FC<GlowProps> = (p) => {
  const SIZE = p.size ?? 800
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    e.currentTarget.style.backgroundPosition = `${x - SIZE / 2}px ${
      y - SIZE / 2
    }px`
  }

  if (isSafari || isMobile) return null

  return (
    <Box
      ref={ref}
      w={SIZE + 'px'}
      h={SIZE + 'px'}
      transition='opacity .2s'
      opacity={0}
      _hover={{
        opacity: 0.08,
      }}
      bgGradient='radial(white, transparent, transparent)'
      onMouseMove={(e) => onMove(e)}
    />
  )
}

const ProjectCard: FC<Props> = (p) => {
  const [isHovering, setIsHovering] = useState(false)
  const { hoverBorderColor } = useStyle()

  // Prefetch project
  api.project.project.useQuery(
    {
      handle: p.projectHandle as string,
    },
    {
      enabled: !!p.projectHandle,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  )

  const Stats = () => {
    return (
      <Box
        position='absolute'
        top='50%'
        bottom={0}
        right={0}
        left={0}
        pointerEvents='none'
      >
        <Flex
          justifyContent='space-between'
          px={5}
          transform='translateY(-50%)'
        >
          {p.stats?.map(({ label, value }, i) => (
            <Flex key={i} flexDir='column' alignItems='center'>
              <Text fontSize={12} opacity={0.4} mb={-1}>
                {label}
              </Text>
              <Flex>
                <Text fontSize={12} opacity={0.8} fontFamily='Outfit Medium'>
                  {value}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Box>
    )
  }

  return (
    <GridItem
      w='100%'
      h='40'
      borderRadius={BORDER_RADIUS}
      borderWidth={1}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      overflow='hidden'
      bg='#ffffff03'
      transition={'.3s'}
      _hover={{
        borderColor: hoverBorderColor,
      }}
      _active={{
        bg: '#ffffff10',
      }}
      position='relative'
      cursor='pointer'
      onClick={() => p.onClick?.()}
    >
      <InnerGlow />
      <Box position='absolute' top={3} left={3} right={3} pointerEvents='none'>
        <Heading fontSize={18} textAlign={'left'} isTruncated>
          <HighlightText searchWord={p.searchWord}>{p.title}</HighlightText>
        </Heading>
        <Text fontSize={12} opacity={0.5}>
          Last updated {moment(p.updatedAt).fromNow()}
        </Text>
        {/* <Text fontSize={16} opacity={0.5} mt={0} isTruncated>
          {p.subtitle}
        </Text> */}
      </Box>
      <Stats />
      <Flex
        position='absolute'
        bottom={2}
        right={2}
        pointerEvents='none'
        flexDir='column'
        alignItems='flex-end'
      >
        <Text fontSize={12} opacity={0.4} mb={-1}>
          {moment(p.createdAt).format('MMM D, YYYY')}
        </Text>
      </Flex>
      <Avatars data={p.members || []} shouldExpand={isHovering} />
    </GridItem>
  )
}

export default ProjectCard
