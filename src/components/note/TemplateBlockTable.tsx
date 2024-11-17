import { FC, useRef } from 'react'
import { Box, Button, Center, Divider, Tooltip } from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { MetadataField } from 'types/template'

import TemplateBlock from './TemplateBlock'

type Props = {
  emptyStateText: string
  addNewText: string
  onlyNoteFields?: boolean
  initialFields?: MetadataField[]
  metadataFields: MetadataField[]
  setMetadataFields: (fields: MetadataField[]) => void
  fieldBeingEdited: string | null
  setFieldBeingEdited: (id: string | null) => void
  idToDelete: string | null
  setIdToDelete: (id: string | null) => void
  onNewFieldClicked: () => void
  saveChanges: (
    fieldId: string,
    name: string,
    metadataBlockVariant: MetadataFieldVariant,
    instruction?: string,
  ) => void
  cancelChanges: (id: string) => void
  addDisabled?: boolean
  onChangePosition: (id: string, direction: 'up' | 'down') => void
  disableEditing?: boolean
}

const TemplateBlockTable: FC<Props> = (p) => {
  const newFieldRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {p.metadataFields.length ? (
        <Box>
          {p.metadataFields.map((field) => (
            <TemplateBlock
              key={field.id}
              metadataBlockVariant={field.variant}
              name={field.name}
              instruction={field.instruction}
              isEditing={p.fieldBeingEdited === field.id}
              onlyNoteFields={p.onlyNoteFields}
              saveChanges={(n, m, instruction) =>
                p.saveChanges(field.id, n, m, instruction)
              }
              cancelChanges={() => p.cancelChanges(field.id)}
              onEditClicked={() => p.setFieldBeingEdited(field.id)}
              onDeleteClicked={() => p.setIdToDelete(field.id)}
              onChangePosition={(dir) => p.onChangePosition(field.id, dir)}
              disableEditing={p.disableEditing}
              isFirst={p.metadataFields[0]?.id === field.id}
              isLast={
                p.metadataFields[p.metadataFields.length - 1]?.id === field.id
              }
            />
          ))}
          {p.metadataFields.length < 2 && <Divider mt={2} mb={2} />}
        </Box>
      ) : null}
      {!p.disableEditing && (
        <Center>
          <Tooltip label={p.addNewText} aria-label='Add new field'>
            <Button
              mt={4}
              // w='100%'
              onClick={p.onNewFieldClicked}
              ref={newFieldRef as any}
              isDisabled={p.addDisabled}
            >
              +
            </Button>
          </Tooltip>
        </Center>
      )}
    </>
  )
}

export default TemplateBlockTable
