import { FC } from 'react'
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from '@chakra-ui/react'
import { BiFilterAlt } from 'react-icons/bi'

import { useGlobalState } from 'hooks/useGlobalState'

type Props = {
  fileFilter: string[]
  setFileFilter: (filters: string[]) => void
}

const AttachmentsFilter: FC<Props> = (p) => {
  const { isSmallScreen } = useGlobalState()

  const isActive = p.fileFilter.length > 0

  const clear = () => {
    p.setFileFilter([])
  }

  const filterOptions = ['Image', 'Video', 'Audio', 'Document', 'PDF']

  return (
    <Box>
      <Menu closeOnSelect={false}>
        <MenuButton
          fontWeight='normal'
          as={Button}
          variant={isActive ? 'solid' : 'outline'}
          borderWidth={1}
          py={isSmallScreen ? 5 : undefined}
          leftIcon={<BiFilterAlt />}
        >
          File Type
        </MenuButton>
        <Portal>
          <MenuList minWidth='240px'>
            {filterOptions.length > 1 ? (
              <>
                <MenuOptionGroup
                  title='File Type'
                  type='checkbox'
                  value={p.fileFilter}
                  onChange={(value) => p.setFileFilter(value as string[])}
                >
                  {filterOptions.map((option, i) => (
                    <MenuItemOption key={i} value={option}>
                      {option}
                    </MenuItemOption>
                  ))}
                </MenuOptionGroup>
              </>
            ) : null}
            <MenuDivider />
            <MenuItemOption onClick={clear}>Clear</MenuItemOption>
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  )
}

export default AttachmentsFilter
