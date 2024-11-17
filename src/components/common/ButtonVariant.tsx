/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC } from 'react'
import {
  Box,
  Button,
  ButtonProps,
  IconButtonProps,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react'
import { BLUE_GRADIENT, BORDER_RADIUS } from 'constants/constants'
import { omit, pick } from 'lodash'

import { useStyle } from 'hooks/useStyle'

type Props = {
  children?: any
  fullWidth?: boolean
}

const ButtonVariant: FC<Props & (ButtonProps | IconButtonProps)> = (p) => {
  const { textColor } = useStyle()
  const bg = useColorModeValue('#ffffffe0', '#000000c0')

  const movedParams = ['mt', 'mb', 'ml', 'mr']

  return (
    <Box {...(p.fullWidth && { w: '100%' })}>
      <Box
        p='1px'
        borderRadius={BORDER_RADIUS}
        bgGradient={BLUE_GRADIENT}
        cursor='pointer'
        display='inline-block'
        opacity={p.isDisabled ? 0.4 : 1}
        {...pick(p, movedParams)}
        {...(p.fullWidth && { w: '100%' })}
      >
        <Button
          {...omit(p, movedParams)}
          {...(p.fullWidth && { w: '100%' })}
          borderRadius={BORDER_RADIUS - 1}
          transition='0.2s'
          _hover={{
            bg: 'transparent',
            color: 'white',
          }}
          _active={{
            bg: '#ffffff30',
          }}
          cursor='pointer'
          bg={bg}
          _disabled={{
            bg: bg,
          }}
          whiteSpace='nowrap'
          position='relative'
          color={textColor}
          borderWidth={0}
        >
          {p.children}
          {p.isLoading && (
            <Box
              position='absolute'
              top='50%'
              left='50%'
              transform='translate(-50%, -50%)'
            >
              <Spinner size='sm' />
            </Box>
          )}
        </Button>
      </Box>
    </Box>
  )
}

export default ButtonVariant
