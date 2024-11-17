import { FC, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
} from '@chakra-ui/react'
import { CheckIcon, ChevronDownIcon, CloseIcon } from '@chakra-ui/icons'

import { useStyle } from 'hooks/useStyle'

type Props = {
  value: string | null | undefined
  options: { label: string; value: string; icon?: JSX.Element }[]
  onSave: (value: string | null | undefined) => void
  placeholder?: string
  isEditable: boolean
}

const EditableDropdown: FC<Props> = (p) => {
  const [isEditing, setIsEditing] = useState(false)
  const [selected, setSelected] = useState(p.value)

  const EditableControls = () => {
    const { interactiveColor } = useStyle()

    return isEditing ? (
      <ButtonGroup justifyContent='center' size='sm' ml={2}>
        <IconButton
          aria-label='Save'
          icon={<CheckIcon />}
          onClick={() => {
            p.onSave(selected)
            setIsEditing(false)
          }}
        />
        <IconButton
          aria-label='Cancel'
          icon={<CloseIcon />}
          onClick={() => {
            setSelected(p.value)
            setIsEditing(false)
          }}
        />
      </ButtonGroup>
    ) : (
      <Flex justifyContent='center'>
        <Button
          variant='link'
          color={interactiveColor}
          margin={0}
          paddingLeft={2}
          aria-label='Edit'
          size='sm'
          fontWeight='bold'
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </Flex>
    )
  }

  return (
    <Box>
      <Flex alignItems='center'>
        {isEditing ? (
          <Menu>
            <MenuButton
              mr={2}
              fontWeight='normal'
              as={Button}
              variant='outline'
              size='md'
              rightIcon={<ChevronDownIcon />}
            >
              {p.options.find((o) => o.value === selected)?.label}
            </MenuButton>
            <Portal>
              <MenuList>
                {p.options.map((o, i) => (
                  <MenuItem
                    onClick={() => {
                      setSelected(o.value)
                    }}
                    icon={o.icon}
                    key={i}
                  >
                    {o.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Portal>
          </Menu>
        ) : (
          <Text>{p.options.find((o) => o.value === p.value)?.label}</Text>
        )}
        {p.isEditable && <EditableControls />}
      </Flex>
    </Box>
  )
}

export default EditableDropdown
