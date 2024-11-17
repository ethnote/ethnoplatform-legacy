import { MetadataFieldVariant, Project } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'

export const projectMetadataFields = (
  project: Partial<Project>,
  templateName: string,
) =>
  (
    project.template as {
      metadataFields: {
        id: string
        variant: MetadataFieldVariant
        name: string
        templateName: string | undefined
      }[]
    }
  ).metadataFields
    .filter((f) => (f?.templateName || DEFAULT_TEMPLATE_NAME) === templateName)
    .map((m, i) => ({
      id: m.id,
      variant: m.variant,
      order: i,
      name: m.name,
    }))
    .sort((a, b) => a.order - b.order)

export const projectNoteFields = (
  project: Partial<Project>,
  templateName: string,
) =>
  (
    project.template as {
      noteFields: {
        id: string
        variant: MetadataFieldVariant
        name: string
        instruction?: string
        templateName: string | undefined
      }[]
    }
  ).noteFields
    .filter((f) => (f?.templateName || DEFAULT_TEMPLATE_NAME) === templateName)
    .map((n, i) => ({
      id: n.id,
      order: i,
      name: n.name,
      instruction: n.instruction,
    }))
    .sort((a, b) => a.order - b.order)
