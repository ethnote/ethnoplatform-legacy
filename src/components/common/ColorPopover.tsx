import { FC } from 'react'
import {
  ButtonGroup,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { HuePicker } from 'react-color'

import { useStyle } from 'hooks/useStyle'

type Props = {
  tempHue: number
  setTempHue: (hue: number) => void
  children: JSX.Element
  onSave: () => void
  isOpen: boolean
  onClose: () => void
}

const ColorPopover: FC<Props> = (p) => {
  const { bg } = useStyle()

  return (
    <Popover
      placement='bottom'
      closeOnBlur={false}
      isOpen={p.isOpen}
      onClose={p.onClose}
    >
      <PopoverTrigger>{p.children}</PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody p={4} bg={bg}>
          <HuePicker
            width='100%'
            color={`hls(${p.tempHue}, 50,50)`}
            onChange={(e) => p.setTempHue(e.hsl.h)}
          />
          <ButtonGroup w='100%' mt={4} variant='outline'>
            <IconButton
              onClick={p.onClose}
              aria-label='Cancel'
              w='100%'
              icon={<CloseIcon />}
            />
            <IconButton
              onClick={p.onSave}
              colorScheme='green'
              aria-label='Save'
              w='100%'
              icon={<CheckIcon />}
            />
          </ButtonGroup>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default ColorPopover
