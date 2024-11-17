import { FC } from 'react'
import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Tag,
  Text,
} from '@chakra-ui/react'
import { AccessibilityLevel } from '@prisma/client'

import { useConfirm } from 'hooks/useConfirm'
import { ContentBox } from 'components'

type Props = {
  accessibilityLevel?: AccessibilityLevel
  isVisible: boolean
  setVisible: (isVisible: boolean) => void
}

const NoteVisibility: FC<Props> = (p) => {
  const { confirm } = useConfirm()

  if (
    p.accessibilityLevel &&
    ![
      'ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL',
      'ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER',
    ].includes(p.accessibilityLevel)
  ) {
    return null
  }

  const releaseDescription =
    {
      ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL:
        'All project notes are hidden until released to all project members.',
      ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER:
        'All project notes are hidden until released to project owners.',
    }[p.accessibilityLevel as string] || ''

  const releaseText =
    {
      ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL:
        'Release note to all project members',
      ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER:
        'Release to project owners',
    }[p.accessibilityLevel as string] || ''

  const onChange = () => {
    if (p.isVisible) {
      confirm({
        title: 'Hide note',
        message: 'Are you sure you want to hide this note?',
        confirmText: 'Hide note',
        onConfirm: () => p.setVisible(false),
      })
    } else {
      confirm({
        title: 'Make visible',
        message: 'Are you sure you want to make this note visible?',
        confirmText: 'Make visible',
        onConfirm: () => p.setVisible(true),
      })
    }
  }

  return (
    <ContentBox title='Visibility'>
      <Text opacity={0.5} fontSize='sm'>
        {releaseDescription}
      </Text>
      <FormControl display='flex' alignItems='center' mt={2}>
        <FormLabel htmlFor='email-alerts' mb='0'>
          {releaseText}
        </FormLabel>
        <Flex alignItems='center'>
          <Switch
            id='email-alerts'
            isChecked={p.isVisible}
            onChange={onChange}
          />
          <Tag ml={3} colorScheme={p.isVisible ? 'green' : 'gray'}>
            {p.isVisible ? 'Visible' : 'Hidden'}
          </Tag>
        </Flex>
      </FormControl>
    </ContentBox>
  )
}

export default NoteVisibility
