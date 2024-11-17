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
  options: string[]
  activeTemplateNameFilters: string[]
  setActiveTemplateNameFilters: (filters: string[]) => void
  notesMembers:
    | { name: string | null | undefined; id: string | undefined }[]
    | undefined
  memberIdFilter: string[]
  setMemberIdFilter: (ids: string[]) => void
  myId: string | undefined
}

const NoteFilter: FC<Props> = (p) => {
  const { isSmallScreen } = useGlobalState()

  const isActive =
    p.activeTemplateNameFilters.length > 0 || p.memberIdFilter.length > 0

  const clear = () => {
    p.setActiveTemplateNameFilters([])
    p.setMemberIdFilter([])
  }

  const notesMembersIds = [...new Set(p.notesMembers?.map((m) => m.id))]

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
          Filter
        </MenuButton>
        <Portal>
          <MenuList minWidth='240px'>
            <MenuOptionGroup
              title='Team'
              type='checkbox'
              value={p.memberIdFilter}
              onChange={(value) => {
                p.setMemberIdFilter(value as string[])
              }}
            >
              {notesMembersIds?.map((id) => (
                <MenuItemOption value={id} key={id}>
                  {p.notesMembers?.find((m) => m.id === id)?.name}
                  {id === p.myId ? ' (you)' : ''}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
            {p.options.length > 1 ? (
              <>
                <MenuOptionGroup
                  title='Template'
                  type='checkbox'
                  value={p.activeTemplateNameFilters}
                  onChange={(value) =>
                    p.setActiveTemplateNameFilters(value as string[])
                  }
                >
                  {p.options.map((option, i) => (
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

export default NoteFilter
