import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import { Select } from 'chakra-react-select'
import { BORDER_RADIUS, DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { capitalize } from 'lodash'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { Modal } from 'components'
import { Icon, mapMetadataFieldNames } from './TemplateBlock'

type Props = {
  isOpen: boolean
  onClose: () => void
  note: inferRouterOutputs<AppRouter>['note']['note']
}

const SyncTemplateModal: FC<Props> = (p) => {
  const { query } = useRouter()
  const utils = api.useContext()

  const [selectedTemplateName, setSelectedTemplateName] = useState<
    string | undefined
  >()
  const [selectedFieldsToAdd, setSelectedFieldsToAdd] = useState<string[]>([])

  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
    },
  )

  const updateNoteFields = api.note.updateNoteFields.useMutation({
    onSettled() {
      utils.note.note.invalidate()
    },
    onSuccess() {
      p.onClose()
    },
  })

  const template = project?.template as {
    metadataFields: {
      id: string
      name: string
      templateName: string
      variant: MetadataFieldVariant
    }[]
    noteFields: {
      id: string
      name: string
      templateName: string
      variant: MetadataFieldVariant
    }[]
  } | null

  const templateNames = (project?.templateNames || [
    DEFAULT_TEMPLATE_NAME,
  ]) as string[]

  useEffect(() => {
    setSelectedTemplateName(
      templateNames.find((n) => n === p.note?.templateName),
    )
    setSelectedFieldsToAdd([])
  }, [templateNames, p.isOpen, p.note?.templateName])

  useEffect(() => {
    setSelectedFieldsToAdd([])
  }, [selectedTemplateName])

  const selectedTemplate = {
    metadataFields: template?.metadataFields?.filter(
      (t) => t?.templateName === selectedTemplateName,
    ),
    noteFields: template?.noteFields?.filter(
      (t) => t?.templateName === selectedTemplateName,
    ),
  }

  const fields = [
    ...(selectedTemplate?.metadataFields ?? []),
    ...(selectedTemplate?.noteFields ?? []),
  ].map((f) => ({
    id: f.id,
    variant: f.variant,
    name: f.name,
    isInUse:
      !!p.note?.metadataFields?.find((m) => m.metadataFieldId === f.id) ||
      !!p.note?.noteFields?.find((n) => n.noteFieldId === f.id),
  })) as {
    id: string
    variant: string
    name: string
    isInUse: boolean
  }[]

  const onSubmit = async () => {
    if (!p.note?.id) return

    updateNoteFields.mutateAsync({
      id: p.note?.id,
      fieldIdsToAdd: selectedFieldsToAdd,
    })
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Sync Template'
      size='2xl'
    >
      <Box mt={12}>
        <Select
          colorScheme='purple'
          placeholder='Choose template to sync with...'
          selectedOptionStyle='check'
          chakraStyles={{
            control: (provided) => ({
              ...provided,
              borderRadius: BORDER_RADIUS,
            }),
            menuList: (provided) => ({
              ...provided,
              borderRadius: BORDER_RADIUS,
            }),
          }}
          value={{
            label: selectedTemplateName || '',
            value: selectedTemplateName || '',
          }}
          onChange={(value) =>
            value?.value && setSelectedTemplateName(value?.value)
          }
          options={templateNames.map((name) => ({
            label: name,
            value: name,
          }))}
        />
      </Box>
      {fields.length > 0 ? (
        <TableContainer my={8} borderWidth={1} borderRadius={BORDER_RADIUS}>
          <Table variant='simple'>
            <Tbody>
              <Tr>
                <Td fontWeight='bold'>Include</Td>
                <Td fontWeight='bold'>Name</Td>
                <Td fontWeight='bold'>Variant</Td>
              </Tr>
              {fields.map(({ id, variant, name, isInUse }, i) => {
                return (
                  <Tr key={i} opacity={isInUse ? 0.5 : 1}>
                    <Td>
                      {!isInUse && (
                        <Checkbox
                          isChecked={selectedFieldsToAdd.includes(id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFieldsToAdd([
                                ...selectedFieldsToAdd,
                                id,
                              ])
                            } else {
                              setSelectedFieldsToAdd(
                                selectedFieldsToAdd.filter((n) => n !== id),
                              )
                            }
                          }}
                        />
                      )}
                    </Td>
                    <Td>
                      {name} {isInUse ? '(included)' : ''}
                    </Td>
                    <Td>
                      <Flex>
                        <Box
                          display='inline-block'
                          mr={2}
                          alignItems='center'
                          transform='translateY(2px)'
                        >
                          <Icon type={variant as MetadataFieldVariant} />
                        </Box>
                        <Text>
                          {capitalize(
                            (
                              mapMetadataFieldNames(
                                variant as MetadataFieldVariant,
                              ) ?? ''
                            )
                              .split('_')
                              .join(' '),
                          )}
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Box h={8} />
      )}
      <Flex justifyContent='flex-end'>
        <ButtonGroup mb={4}>
          <Button onClick={p.onClose}>Cancel</Button>
          <Button
            isDisabled={selectedFieldsToAdd.length === 0}
            onClick={onSubmit}
            isLoading={updateNoteFields.isLoading}
          >
            Add fields
          </Button>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default SyncTemplateModal
