import { MetadataFieldVariant } from '@prisma/client'

export type MetadataField = {
  id: string
  name: string
  variant: MetadataFieldVariant
  templateName?: string
  instruction?: string
}

export type Template = {
  noteFields: MetadataField[]
  metadataFields: MetadataField[]
}
