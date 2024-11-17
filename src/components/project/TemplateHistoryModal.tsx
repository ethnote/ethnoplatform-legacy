import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { BORDER_RADIUS, DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { capitalize } from 'lodash'
import moment from 'moment'

import { api } from 'utils/api'
import { Modal } from 'components'
import { mapMetadataFieldNames } from 'components/note/TemplateBlock'

type Props = {
  isOpen: boolean
  onClose: () => void
}

const TemplateHistoryModal: FC<Props> = (p) => {
  const { query } = useRouter()

  const { data: project, isLoading: projectIsLoading } =
    api.project.project.useQuery(
      {
        handle: query.projectHandle as string,
      },
      {
        enabled: !!query.projectHandle,
      },
    )

  const notes = project?.notes

  const templates = notes?.reduce(
    (acc, note) => {
      const templateVersion = note.templateVersion || '0'
      const templateName = (note.templateName ||
        DEFAULT_TEMPLATE_NAME) as string

      const noteFields = note.noteFields
      const metadataFields = note.metadataFields

      return {
        ...acc,
        [templateVersion]: {
          ...acc[templateVersion],
          [templateName]: {
            metafields: metadataFields || [],
            noteFields: noteFields || [],
            notes: [
              ...(acc[templateVersion]?.[templateName]?.notes || []),
              {
                noteHandle: note.handle,
                title: note.title,
                createdAt: note.createdAt,
              },
            ],
          },
        },
      }
    },
    {} as {
      [templateVersion: string]: {
        [templateName: string]: {
          metafields: {
            name: string
            variant: MetadataFieldVariant
          }[]
          noteFields: {
            name: string
          }[]
          notes: {
            noteHandle: string | null
            title: string
            createdAt?: Date
          }[]
        }
      }
    },
  )

  const templateVersions = Object.keys(templates || {}).sort(
    (a, b) => Number(b) - Number(a),
  )

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Template History'
      closeButton
      size='5xl'
    >
      <Center>
        <Text opacity={0.7}>Overview of active templates</Text>
      </Center>
      <Box
        overflow='scroll'
        maxH='calc(80vh - 100px)'
        px={4}
        bg='whiteAlpha.50'
        borderRadius={10}
        mt={4}
        pb={4}
      >
        <Skeleton isLoaded={!projectIsLoading}>
          {templateVersions.map((templateVersion, i) => {
            const templateNames = Object.keys(
              templates?.[templateVersion] || {},
            )

            const notesUsingThisVersion = templateNames.reduce(
              (acc, templateName) => {
                return [
                  ...acc,
                  ...(templates?.[templateVersion]?.[templateName]?.notes ||
                    []),
                ]
              },
              [] as {
                noteHandle: string | null
                title: string
                createdAt?: Date
              }[],
            )

            const firstDay = moment(
              notesUsingThisVersion
                .map((n) => n.createdAt)
                .sort((a, b) => Number(a) - Number(b))[0],
            ).format('MMM D, YYYY')

            const lastDay = moment(
              notesUsingThisVersion
                .map((n) => n.createdAt)
                .sort((a, b) => Number(b) - Number(a))[0],
            ).format('MMM D, YYYY')

            const isSameDay = firstDay === lastDay

            return (
              <Box key={i}>
                <Heading size='md' mt={4} mb={2}>
                  Version {templateVersion}
                  <Text
                    ml={2}
                    fontFamily='Outfit Regular'
                    fontWeight='normal'
                    display='inline-block'
                    fontSize='md'
                    opacity={0.5}
                  >
                    {isSameDay ? firstDay : `${firstDay} - ${lastDay}`}
                  </Text>
                </Heading>
                <TableContainer borderWidth={1} borderRadius={BORDER_RADIUS}>
                  <Table variant='simple'>
                    <Tbody>
                      <Tr borderBottomWidth={1.5}>
                        <Td fontWeight='bold'>Name</Td>
                        <Td fontWeight='bold'>Template Boxes</Td>
                        <Td fontWeight='bold'>Notes</Td>
                      </Tr>
                      {templateNames.map((templateName) => {
                        const thisVersion = templates?.[templateVersion]
                        const { metafields, noteFields, notes } = thisVersion?.[
                          templateName
                        ] || {
                          metafields: [],
                          noteFields: [],
                          notes: [],
                        }

                        if (!metafields?.length && !noteFields?.length)
                          return null

                        return (
                          <Tr key={templateName}>
                            <Td>{templateName}</Td>
                            <Td>
                              {!!metafields?.length && (
                                <Box>
                                  <Box fontWeight='bold' mb={1}>
                                    Context
                                  </Box>
                                  <Box pl={4} opacity={0.7}>
                                    {metafields.map((f, i) => (
                                      <Box key={i} mb={1}>
                                        - {f.name} (
                                        {capitalize(
                                          mapMetadataFieldNames(
                                            f.variant as MetadataFieldVariant,
                                          )
                                            .split('_')
                                            .join(' '),
                                        )}
                                        )
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              {!!noteFields?.length && (
                                <Box mt={4}>
                                  <Box fontWeight='bold' mb={1}>
                                    Text
                                  </Box>
                                  <Box pl={4} mb={1} opacity={0.7}>
                                    {noteFields.map((f, i) => (
                                      <Box key={i}>- {f.name}</Box>
                                    ))}
                                  </Box>
                                </Box>
                              )}
                            </Td>
                            <Td>
                              {!!notes?.length && (
                                <Box mt={4}>
                                  {notes.map((n, i) => (
                                    <Box key={i}>
                                      <Link
                                        href={`/projects/${query.projectHandle}/notes/${n.noteHandle}`}
                                      >
                                        <Button
                                          variant='link'
                                          colorScheme='blue'
                                        >
                                          {n.title} (
                                          {moment(n.createdAt).format(
                                            'MMM D, YYYY',
                                          )}
                                          )
                                        </Button>
                                      </Link>
                                    </Box>
                                  ))}
                                </Box>
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
          })}
        </Skeleton>
      </Box>
      <Flex justifyContent='flex-end' mt={4}>
        <ButtonGroup mb={4}>
          <Button onClick={p.onClose}>Close</Button>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default TemplateHistoryModal
