import { FC, useEffect } from 'react'
import {
  Box,
  Checkbox,
  ListItem,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  UnorderedList,
} from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { BORDER_RADIUS, DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { capitalize } from 'lodash'
import { Template } from 'types/template'

import { mapMetadataFieldNames } from 'components/note/TemplateBlock'

type Props = {
  template?: Template
  selectedTemplateNames: string[]
  setSelectedTemplateNames: (names: string[]) => void
}

const SelectExistingTemplate: FC<Props> = (p) => {
  const templateNames = [
    ...new Set([
      ...[
        ...(p.template?.metadataFields || []),
        ...(p.template?.noteFields || []),
      ].map((f) => f?.templateName || DEFAULT_TEMPLATE_NAME),
    ]),
  ].filter(Boolean) as string[]

  useEffect(() => {
    p.setSelectedTemplateNames(templateNames)
  }, [p.template])

  if (!p.template) return <Box h={12} />

  return (
    <Box py={8}>
      <TableContainer borderWidth={1} borderRadius={BORDER_RADIUS}>
        <Table variant='simple'>
          <Tbody>
            <Tr>
              <Td fontWeight='bold'>Include</Td>
              <Td fontWeight='bold'>Name</Td>
              <Td fontWeight='bold'>Template</Td>
            </Tr>
            {templateNames.map((name) => {
              const metafields = p.template?.metadataFields.filter(
                (f) => f.templateName === name,
              )
              const noteFields = p.template?.noteFields.filter(
                (f) => f.templateName === name,
              )

              if (!metafields?.length && !noteFields?.length) return null

              return (
                <Tr key={name}>
                  <Td>
                    <Checkbox
                      isChecked={p.selectedTemplateNames.includes(name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          p.setSelectedTemplateNames([
                            ...p.selectedTemplateNames,
                            name,
                          ])
                        } else {
                          p.setSelectedTemplateNames(
                            p.selectedTemplateNames.filter((n) => n !== name),
                          )
                        }
                      }}
                    />
                  </Td>
                  <Td>{name}</Td>
                  <Td>
                    {!!metafields?.length && (
                      <UnorderedList>
                        <ListItem>Context</ListItem>
                        <UnorderedList>
                          {metafields.map((f, i) => (
                            <ListItem key={i}>
                              {f.name} (
                              {capitalize(
                                mapMetadataFieldNames(
                                  f.variant as MetadataFieldVariant,
                                )
                                  .split('_')
                                  .join(' '),
                              )}
                              )
                            </ListItem>
                          ))}
                        </UnorderedList>
                      </UnorderedList>
                    )}
                    {!!noteFields?.length && (
                      <UnorderedList mt={4}>
                        <ListItem>Text</ListItem>
                        <UnorderedList>
                          {noteFields.map((f, i) => (
                            <ListItem key={i}>{f.name}</ListItem>
                          ))}
                        </UnorderedList>
                      </UnorderedList>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SelectExistingTemplate
