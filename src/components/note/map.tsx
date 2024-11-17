import { FC, useState } from 'react'
import { Box, Center, Switch, Text } from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import { AppRouter } from 'server/api/root'

import { ContentBox, Map } from 'components'

type Pin = {
  latitude: number
  longitude: number
  name: string
  link: string
}

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const ProjectMap: FC<Props> = (p) => {
  const [showNoteLabel, setShowNoteLabel] = useState(true)

  const template = p.project?.template as {
    metadataFields: {
      id: string
      name: string
      variant: MetadataFieldVariant
    }[]
  }

  const locationMetadataFieldIds = template?.metadataFields
    .filter((field) => field.variant === MetadataFieldVariant.LOCATION)
    .map((field) => field.id)

  const stringToCoordinates = (str: string) => {
    const partsSemicolon = str.split(';')
    const partsComma = str.split(',')

    if (partsSemicolon.length === 3) {
      return {
        latitude: +(partsSemicolon[1] || 0),
        longitude: +(partsSemicolon[2] || 0),
      }
    } else if (partsComma.length === 2) {
      return {
        latitude: +(partsComma[0] || 0),
        longitude: +(partsComma[1] || 0),
      }
    } else {
      return {
        latitude: 0,
        longitude: 0,
      }
    }
  }

  const pins = (p.visibleNotes?.flatMap((note) =>
    note.metadataFields
      .filter(
        (field) =>
          field.metadataFieldId &&
          locationMetadataFieldIds.includes(field.metadataFieldId),
      )
      .map((field) => {
        const { latitude, longitude } = stringToCoordinates(field?.value || '')

        return {
          latitude,
          longitude,
          name: showNoteLabel ? note.title : '',
          link: `/projects/${p.project?.handle}/notes/${note.handle}`,
        }
      })
      .filter(Boolean),
  ) || []) as Pin[]

  return (
    <ContentBox>
      <Switch
        mb={4}
        isChecked={showNoteLabel}
        onChange={(e) => setShowNoteLabel(e.target.checked)}
      >
        Show labels
      </Switch>
      <Box h={pins?.length > 0 ? '600px' : undefined}>
        {pins?.length > 0 ? (
          <Map pins={pins} />
        ) : (
          <Center p={8}>
            <Text opacity={0.5}>No locations were found</Text>
          </Center>
        )}
      </Box>
    </ContentBox>
  )
}

export default ProjectMap
