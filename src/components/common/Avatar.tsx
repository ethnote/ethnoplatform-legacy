import { FC } from 'react'
import {
  Box,
  BoxProps,
  Center,
  Image,
  Text,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import ColorHash from 'color-hash'
import { AiOutlineUser } from 'react-icons/ai'

import { useStyle } from 'hooks/useStyle'

type Props = {
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'huge'
  name?: string | null
  noColor?: boolean
  textOverride?: string
  hideTooltip?: boolean
  hue?: number | null
}

const Avatar: FC<Props & BoxProps> = ({
  size: inputSize,
  src,
  name,
  textOverride,
  ...p
}) => {
  const { back } = useStyle()
  const { colorMode } = useColorMode()

  const size = {
    xs: 6,
    sm: 8,
    md: 10,
    lg: 12,
    huge: 24,
  }[inputSize || 'md']

  const textSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    huge: 30,
  }[inputSize || 'md']

  const initials = name
    ?.split(' ')
    .map((n, i) => (i === 0 || i === name.split(' ').length - 1 ? n[0] : ''))
    .join('')
    .toUpperCase()

  const colorHash = new ColorHash({
    saturation: 0.6,
    lightness: colorMode === 'dark' ? 0.3 : 0.9,
  })

  const colorHashtext = new ColorHash({
    saturation: 0.6,
    lightness: colorMode === 'dark' ? 0.8 : 0.5,
  })

  const colorBg =
    typeof p.hue === 'number'
      ? `hsl(${p.hue}, 60%, ${colorMode === 'dark' ? '30' : '90'}%)`
      : colorHash.hex(name || '')
  const colorText =
    typeof p.hue === 'number'
      ? `hsl(${p.hue}, 60%, ${colorMode === 'dark' ? '80' : '50'}%)`
      : colorHashtext.hex(name || '')

  return (
    <Tooltip
      label={
        p.hideTooltip ? undefined : textOverride ? undefined : name || undefined
      }
    >
      <Box
        position='relative'
        minW={size}
        minH={size}
        maxW={size}
        borderRadius='full'
        maxH={size}
        overflow='hidden'
        {...p}
      >
        {src ? (
          <Image
            src={src}
            minW={size}
            minH={size}
            maxW={size}
            maxH={size}
            objectFit='cover'
            alt=''
          />
        ) : (
          <Center
            bg={
              p.noColor
                ? back
                : colorBg ?? (colorHash.hex(name || '') as string)
            }
            position='absolute'
            top={0}
            bottom={0}
            left={0}
            right={0}
            fontFamily='Outfit Medium'
            fontSize='sm'
          >
            {name || textOverride ? (
              <Text
                mt={0.5}
                fontSize={textSize}
                color={
                  p.noColor
                    ? undefined
                    : colorText ?? (colorHashtext.hex(name || '') as string)
                }
                cursor='default'
              >
                {textOverride ?? initials}
              </Text>
            ) : (
              <Box opacity={0.5}>
                <AiOutlineUser size={textSize} />
              </Box>
            )}
          </Center>
        )}
      </Box>
    </Tooltip>
  )
}

export default Avatar
