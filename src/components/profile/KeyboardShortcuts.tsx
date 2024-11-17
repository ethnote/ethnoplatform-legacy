import { FC, useState } from 'react'
import { Heading } from '@chakra-ui/react'
import { isMobile } from 'react-device-detect'

import { api } from 'utils/api'
import {
  ContentBox,
  KeyboardShortcutItem,
  KeyboardShortcutModal,
} from 'components'

type Props = {
  param?: string
}

const KeyboardShortcuts: FC<Props> = () => {
  const { data: me } = api.me.me.useQuery()
  const { timestampShortcutCode } = me || {
    timestampShortcutCode: 'enter',
  }

  const [timestampShortcutModalIsOpen, setTimestampShortcutModalIsOpen] =
    useState(false)

  if (isMobile) return null

  return (
    <ContentBox>
      <Heading mb={6} as='h2' fontSize={20} textAlign={'left'}>
        Keyboard Shortcuts
      </Heading>

      <Heading mb={2} as='h3' fontSize={16} textAlign={'left'}>
        Note Text Editor
      </Heading>
      <KeyboardShortcutItem
        code={timestampShortcutCode || 'enter'}
        onEditClick={() => setTimestampShortcutModalIsOpen(true)}
        shortcutText={'Timestamp'}
        shortcutDescription={
          'In the text editor on the note page, press this shortcut to make a timestamp.'
        }
      />
      <KeyboardShortcutModal
        isOpen={timestampShortcutModalIsOpen}
        onClose={() => setTimestampShortcutModalIsOpen(false)}
        currentKeyboardCode={timestampShortcutCode || ''}
      />
    </ContentBox>
  )
}

export default KeyboardShortcuts
