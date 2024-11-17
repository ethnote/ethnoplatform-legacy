import { FC, ReactNode } from 'react'
import {
  Box,
  Button,
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tooltip,
} from '@chakra-ui/react'
import { AiFillCheckCircle } from 'react-icons/ai'

export type DropdownOption = {
  label: string
  icon?: JSX.Element
  onClick: () => void
  isDisabled?: boolean
  isActive?: boolean
}

type Props = {
  children: ReactNode
  options: DropdownOption[]
  tooltip?: string
}

const DropdownMenu: FC<Props> = (p) => {
  return (
    <ChakraMenu variant='custom'>
      <Tooltip label={p.tooltip}>
        <ChakraMenuButton as={Button} variant='unstyled'>
          {p.children}
        </ChakraMenuButton>
      </Tooltip>

      <Portal>
        <MenuList>
          {p.options.map((o, i) => (
            <MenuItem
              key={i}
              icon={o.icon}
              onClick={o.onClick}
              isDisabled={o.isDisabled}
            >
              {o.label}
              {o.isActive && (
                <Box ml={1}>
                  <AiFillCheckCircle />
                </Box>
              )}
            </MenuItem>
          ))}
        </MenuList>
      </Portal>
    </ChakraMenu>
  )
}

export default DropdownMenu
