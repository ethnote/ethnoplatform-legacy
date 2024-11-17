import { FC, useCallback } from 'react'
import { Box, Grid, GridItem } from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import { AppRouter } from 'server/api/root'

import { MultilineText } from 'components'
import { Field } from './MetadataField'

type Props = {
  note?: inferRouterOutputs<AppRouter>['note']['note']
  onMetadataFieldChanged: ({
    metadataFieldId,
    value,
  }: {
    metadataFieldId: string
    value: string
  }) => void
  canEdit: boolean
}

const MetadataFields: FC<Props> = (p) => {
  const getColSpan = useCallback((variant?: MetadataFieldVariant) => {
    switch (variant) {
      case MetadataFieldVariant.MULTILINE:
        return {
          base: 1,
          md: 2,
        }
      case MetadataFieldVariant.INFO_TEXT:
        return {
          base: 1,
          md: 2,
        }
      default:
        return {
          base: 1,
          md: 1,
        }
    }
  }, [])

  return (
    <Box>
      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(2, 1fr)',
        }}
        gap={4}
      >
        {p.note?.metadataFields
          ?.sort((a, b) => (a.order || 0) - (b.order || 0))
          ?.map((field, i) => {
            const isInfoText = field.variant === MetadataFieldVariant.INFO_TEXT
            return (
              <GridItem colSpan={getColSpan(field.variant)} key={i}>
                <MultilineText
                  fontSize={isInfoText ? undefined : 'sm'}
                  opacity={isInfoText ? 1 : 0.5}
                  mb={1}
                >
                  {field.name}
                </MultilineText>
                <Box mb={4}>
                  <Field
                    variant={field.variant!}
                    id={field.metadataFieldId!}
                    value={field.value || ''}
                    canEdit={p.canEdit}
                    onMetadataFieldChanged={p.onMetadataFieldChanged}
                    projectId={p.note?.project?.id}
                  />
                </Box>
              </GridItem>
            )
          })}
      </Grid>
    </Box>
  )
}

export default MetadataFields
