import { FC } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Input,
  Text,
  useEditableControls,
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon } from '@chakra-ui/icons'

import { useStyle } from 'hooks/useStyle'

type Props = {
  value: string | null | undefined
  onSave: (value: string | null | undefined) => void
  placeholder?: string
  isEditable: boolean
  fontSize?: string
  valueOverride?: boolean
  onDelete?: () => void
}

const EditableText: FC<Props> = (p) => {
  const { interactiveColor } = useStyle()

  const Inner = () => {
    const {
      isEditing,
      getSubmitButtonProps,
      getCancelButtonProps,
      getEditButtonProps,
    } = useEditableControls()

    const EditableControls = () => {
      return isEditing ? (
        <ButtonGroup justifyContent='center' size='sm' ml={2}>
          <IconButton
            aria-label='Save'
            icon={<CheckIcon />}
            {...getSubmitButtonProps()}
          />
          <IconButton
            aria-label='Cancel'
            icon={<CloseIcon />}
            {...getCancelButtonProps()}
          />
        </ButtonGroup>
      ) : (
        <Flex justifyContent='center'>
          <Button
            aria-label='Edit'
            size='sm'
            fontWeight='bold'
            variant='link'
            color={interactiveColor}
            margin={0}
            // pl={2}
            ml={p.onDelete ? 4 : 2}
            {...getEditButtonProps()}
          >
            Edit
          </Button>
          {p.onDelete && (
            <Button
              aria-label='Delete'
              size='sm'
              variant='link'
              // color={danger}
              opacity={0.5}
              m={0}
              ml={3}
              onClick={p.onDelete}
            >
              Delete
            </Button>
          )}
        </Flex>
      )
    }

    return (
      <Flex>
        {!p.valueOverride && <EditablePreview opacity={p.value ? 1 : 0.3} />}
        {p.valueOverride && !isEditing && <Text>{p.value}</Text>}
        <Input
          fontSize={p.fontSize}
          variant='themed'
          maxW={96}
          as={EditableInput}
          size='sm'
        />
        {p.isEditable && <EditableControls />}
      </Flex>
    )
  }

  return (
    <Box>
      <Editable
        defaultValue={p.value || ''}
        fontSize={p.fontSize}
        placeholder={p.placeholder ?? 'Add a name'}
        isPreviewFocusable={false}
        onSubmit={(v) => p.value !== v && p.onSave(v)}
      >
        <Inner />
      </Editable>
    </Box>
  )
}

export default EditableText
