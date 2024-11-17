import { FC } from 'react'
import { Box, Flex, Heading, IconButton } from '@chakra-ui/react'
import { BsChevronDown, BsChevronUp } from 'react-icons/bs'

import { useIsMinimizedStore } from 'hooks/useIsMinimizedStore'
import { useStyle } from 'hooks/useStyle'

type Props = {
  children?: any
  header?: any
  title?: string
  isCentered?: boolean
  borderColor?: string
  mb?: number
  inverseMinimize?: boolean
  leftForTitle?: any
  bg?: string
}

type WithMinimize = {
  isMinimizable: true
  minimizeId: string
}

type WithoutMinimize = {
  isMinimizable?: false
  minimizeId?: string
}

export type ContentBoxProps = Props & (WithMinimize | WithoutMinimize)

const ContentBox: FC<ContentBoxProps> = (p) => {
  const { bg, contentBoxBorder } = useStyle()
  const { minimizedIds, addMinimizedId, removeMinimizedId } =
    useIsMinimizedStore()

  const isMinimized = p.minimizeId && minimizedIds.includes(p.minimizeId)
  const toggleMinimized = () => {
    if (!p.minimizeId) return
    isMinimized ? removeMinimizedId(p.minimizeId) : addMinimizedId(p.minimizeId)
  }

  const _isMinimized = p.inverseMinimize ? !isMinimized : isMinimized

  return (
    <Box
      bg={p.bg ?? bg}
      w='100%'
      p={{
        base: 3,
        md: 4,
      }}
      borderRadius={{ base: 0, md: 12 }}
      borderWidth={1}
      borderColor={contentBoxBorder}
      mb={
        p.mb ?? {
          base: 3,
          md: 4,
        }
      }
      position={p.isMinimizable ? 'relative' : undefined}
    >
      {p.leftForTitle && (
        <Flex justifyContent='flex-end' position='absolute' top={3} left={3}>
          {p.leftForTitle}
        </Flex>
      )}
      <Flex
        mb={_isMinimized || !p.title ? 0 : 4}
        alignItems='center'
        w='100%'
        onClick={toggleMinimized}
        cursor={p.isMinimizable ? 'pointer' : undefined}
        ml={p.leftForTitle ? 9 : 0}
      >
        {p.title && (
          <Heading fontSize={20} textAlign={p.isCentered ? 'center' : 'left'}>
            {p.title}
          </Heading>
        )}
      </Flex>
      {p.isMinimizable && (
        <Flex
          justifyContent='flex-end'
          position='absolute'
          top={{
            base: 2.5,
            md: 3,
          }}
          right={{
            base: 2.5,
            md: 3,
          }}
        >
          <IconButton
            icon={_isMinimized ? <BsChevronDown /> : <BsChevronUp />}
            aria-label=''
            size='sm'
            variant='ghost'
            onClick={toggleMinimized}
          />
        </Flex>
      )}
      {p.header}
      <Box
        overflow={_isMinimized ? 'hidden' : undefined}
        maxH={_isMinimized ? 0 : undefined}
      >
        {p.children}
      </Box>
    </Box>
  )
}

export default ContentBox
