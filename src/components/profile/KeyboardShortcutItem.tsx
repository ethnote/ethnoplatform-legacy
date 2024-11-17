import { FC } from 'react'
import { Box, Flex, IconButton, Kbd, Text } from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import { isMacOs } from 'react-device-detect'

type Props = {
  shortcutText: string
  shortcutDescription: string
  onEditClick?: () => void
  code: string
}

const KeyboardShortcutItem: FC<Props> = (p) => {
  return (
    <Box>
      <Flex gap={1} alignItems='center'>
        <Text>{p.shortcutText}</Text>
        <span>
          <Kbd>{isMacOs ? 'cmd' : 'ctrl'}</Kbd> + <Kbd>{p.code}</Kbd>
        </span>
        <IconButton
          onClick={p.onEditClick}
          ml={2}
          aria-label='Edit'
          size='sm'
          icon={<EditIcon />}
        />
      </Flex>
      <Text size='sm' opacity={0.5}>
        {p.shortcutDescription}
      </Text>
    </Box>
  )
}

export default KeyboardShortcutItem
