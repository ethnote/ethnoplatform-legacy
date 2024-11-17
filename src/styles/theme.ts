import { theme as baseTheme, extendTheme } from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'

export const colors = {
  gray: {
    50: '#F8F9FD',
    100: '#F0F1F3',
    200: '#E6E7EB',
    300: '#D2D3D7',
    400: '#ABACB0',
    500: '#7D7E82',
    600: '#535458',
    700: '#35363A',
    800: '#1E1F23',
    900: '#18191D',
    950: '#17171A',
  },
}

const Input = {
  variants: {
    themed: {
      field: {
        borderRadius: BORDER_RADIUS,
        bg: 'transparent',
        borderWidth: 1,
      },
    },
  },
}

const Button = {
  baseStyle: {
    fontFamily: 'Outfit Medium',
    fontWeight: 'medium',
    borderRadius: BORDER_RADIUS,
  },
}

const Menu = {
  baseStyle: {
    list: {
      bg: 'white',
      _dark: {
        bg: 'gray.800',
      },
      borderRadius: BORDER_RADIUS,
      p: 1,
    },
    item: {
      borderRadius: 6,
      bg: 'transparent',
      _dark: {
        bg: 'transparent',
      },
      _hover: {
        bg: 'gray.100',
        _dark: {
          bg: 'gray.700',
        },
      },
    },
  },
}

const Skeleton = {
  baseStyle: {
    borderRadius: BORDER_RADIUS / 2,
  },
}

export const theme = extendTheme(
  {
    colors,
    fonts: {
      heading: 'Outfit Bold',
      body: 'Outfit Regular',
    },
    components: {
      Input,
      Button,
      Menu,
      Skeleton,
    },
  },
  baseTheme,
)
