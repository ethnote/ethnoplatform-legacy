import { MetadataFieldVariant } from '@prisma/client'
import moment from 'moment'
import { z } from 'zod'

import { mapMetadataFieldNames } from 'components/note/TemplateBlock'
import { protectedProcedure } from '../../trpc'
import { getNotesAsJson } from './exportNotesAsJSON'

export const exportNotesAsTXT = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      noteIds: z.array(z.string()),
      includeInfoText: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const projectWithNotes = await getNotesAsJson({
      prisma: ctx.prisma,
      session: ctx.session,
      projectId: input.projectId,
      noteIds: input.noteIds,
      includeInfoText: input.includeInfoText,
    })

    let output = ''

    output += `Project: ${projectWithNotes.name}` + '\n'
    output +=
      `Created ${moment(projectWithNotes.createdAt).format(
        'MMM D, YYYY - HH:mm',
      )}` + '\n'
    output +=
      `Team: ${projectWithNotes.projectMemberships
        .map((p) => p.user?.fullName)
        .join(', ')}` + '\n'
    output += '______________________________________________________'
    output += '\n'
    output += '\n'

    output += `Templates:` + '\n'
    output += '\n'

    Object.keys(projectWithNotes.templates).forEach((templateName) => {
      output += `${templateName}:` + '\n'

      const template = projectWithNotes.templates[
        templateName as keyof typeof projectWithNotes.templates
      ] as {
        metadataFields: {
          name: string
          variant: string
        }[]
        noteFields: {
          name: string
        }[]
      }

      template.metadataFields.forEach((field) => {
        output +=
          `${field.name} (${mapMetadataFieldNames(
            field.variant as MetadataFieldVariant,
          )
            .toLocaleLowerCase()
            .replace('_', ' ')})` + '\n'
      })

      template.noteFields.forEach((field) => {
        output += `${field.name} (text)` + '\n'
      })

      output += '\n'
    })

    output += '______________________________________________________'
    output += '\n'
    output += '\n'

    projectWithNotes.notes.forEach((note) => {
      output += `Note title: ${note.title}` + '\n'
      output +=
        `Template: ${note.templateName} (version ${note.templateVersion})` +
        '\n'
      output +=
        `Created ${moment(note.createdAt).format('MMM D, YYYY - HH:mm')}` + '\n'
      output += `Authored by ${note.author?.fullName}` + '\n'
      output += note.author?.email + '\n'
      output += '\n'
      output += `Hashtags: ${[
        ...new Set(note.noteFields.flatMap((n) => n.hashtags)),
      ].join(', ')}\n`
      output += `Mentions: ${[
        ...new Set(note.noteFields.flatMap((n) => n.mentions)),
      ].join(', ')}\n`
      output += '\n'
      output += '\n'

      if (note.metadataFields.length) {
        output += 'Metadata:' + '\n'
        output += '\n'
      }

      note.metadataFields.forEach((field) => {
        output +=
          `${field.name} (${field.variant
            .toLocaleLowerCase()
            .replace('_', ' ')}):` + '\n'
        output += field.value + '\n'
        output += '\n'
      })

      if (note.noteFields.length) {
        output += 'Note fields:' + '\n'
        output += '\n'
      }

      note.noteFields.forEach((field) => {
        output += `${field.name}:` + '\n'
        output += field.content + '\n'
        output += '\n'
      })

      output += '______________________________________________________'
      output += '\n'
      output += '\n'
    })

    return output
  })
