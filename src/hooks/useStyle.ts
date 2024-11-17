import { useColorModeValue } from '@chakra-ui/react'

export const useStyle = () => {
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const bg = useColorModeValue('white', '#1A1B1F')
  const menuBg = useColorModeValue('#FFFFFF', '#1A1B1FE0')
  const bgSemiTransparent = useColorModeValue('#ffffff90', '#1E1F2390')
  const bgMoreSemiTransparent = useColorModeValue('gray.100', '#ffffff08')
  const buttonBg = useColorModeValue('gray.100', 'whiteAlpha.200')
  const hoverBorderColor = useColorModeValue('gray.400', 'gray.600')
  const bgSemiTransparentVariant = useColorModeValue('gray.200', '#ffffff18')
  const interactiveColor = useColorModeValue('blue.500', 'blue.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const borderColor2 = useColorModeValue('gray.200', 'whiteAlpha.300')
  const tint = 'blue'
  const hoverBg = useColorModeValue(`${tint}.50`, 'gray.700')
  const back = useColorModeValue('#fcfcfc', '#131518')
  const darkerBg = useColorModeValue('blackAlpha.50', 'blackAlpha.300')
  const contentBoxBorder = useColorModeValue('gray.200', 'transparent')
  const interactive = useColorModeValue('blue.600', 'blue.300')
  const danger = useColorModeValue('red.500', 'red.300')

  return {
    hoverBg,
    textColor,
    bg,
    menuBg,
    hoverBorderColor,
    bgSemiTransparent,
    bgMoreSemiTransparent,
    bgSemiTransparentVariant,
    tint,
    interactiveColor,
    borderColor,
    borderColor2,
    back,
    buttonBg,
    darkerBg,
    contentBoxBorder,
    interactive,
    danger,
  }
}
