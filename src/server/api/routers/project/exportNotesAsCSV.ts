import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getNotesAsJson } from './exportNotesAsJSON'

export const exportNotesAsCSV = protectedProcedure
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

    type Header = {
      name: string | null
      id: string | null
    }

    const headers: Header[] = []
    const rows: string[][] = []

    const makeCSVFriendly = (str: string) => {
      return `"${str.replace(/"/g, '""')}"`
    }

    headers.push(
      {
        name: 'Note Title',
        id: 'noteTitle',
      },
      {
        name: 'Author Fullname',
        id: 'authorFullname',
      },
      {
        name: 'Author Email',
        id: 'authorEmail',
      },
      {
        name: 'Created',
        id: 'createdAt',
      },
      {
        name: 'Last Updated',
        id: 'updatedAt',
      },
      {
        name: 'Template Name',
        id: 'templateName',
      },
      {
        name: 'Template Version',
        id: 'templateVersion',
      },
      {
        name: 'Hashtags',
        id: 'hashtags',
      },
      {
        name: 'Mentions',
        id: 'mentions',
      },
    )

    const noteContent: Record<string, any> = {} // Contains content of note fields that are too long to fit in one cell

    projectWithNotes.notes.forEach((note) => {
      note.metadataFields.forEach((field) => {
        if (!headers.some((header) => header.id === field.metadataFieldId)) {
          headers.push({
            name: makeCSVFriendly(field.name),
            id: field.metadataFieldId,
          })
        }
      })

      note.noteFields.forEach((field) => {
        if (!headers.some((header) => header.id === field.noteFieldId)) {
          const content = note.noteFields.find(
            (n) => n.noteFieldId === field.noteFieldId,
          )?.content as string
          const maxLength = 32000
          const splitInto = Math.ceil((content.length || 0) / maxLength)

          for (let i = 0; i < splitInto; i++) {
            const part = content.substring(
              i * maxLength,
              i * maxLength + maxLength,
            )
            const id = `${field.noteFieldId}-${i}`

            headers.push({
              name: `${field.name}${splitInto > 1 ? ` (${i + 1})` : ''}`,
              id,
            })

            noteContent[id] = part
          }
        }
      })
    })

    projectWithNotes.notes.forEach((note) => {
      const row: string[] = []
      headers.forEach((header) => {
        let content =
          note.metadataFields.find(
            (field) => field.metadataFieldId === header.id,
          )?.value || (header.id ? noteContent[header.id] : '')

        if (header.id === 'noteTitle') {
          content = note.title
        } else if (header.id === 'authorFullname') {
          content = note.author?.fullName || ''
        } else if (header.id === 'authorEmail') {
          content = note.author?.email || ''
        } else if (header.id === 'createdAt') {
          content = note.createdAt.toISOString()
        } else if (header.id === 'updatedAt') {
          content = note.updatedAt.toISOString()
        } else if (header.id === 'templateVersion') {
          content = `${note.templateVersion}` || '0'
        } else if (header.id === 'templateName') {
          content = `${note.templateName}` || DEFAULT_TEMPLATE_NAME
        } else if (header.id === 'hashtags') {
          content = [
            ...new Set(note.noteFields.flatMap((n) => n.hashtags)),
          ].join(', ')
        } else if (header.id === 'mentions') {
          content = [
            ...new Set(note.noteFields.flatMap((n) => n.mentions)),
          ].join(', ')
        }

        if (content) {
          row.push(makeCSVFriendly(content))
        } else {
          row.push('')
        }
      })
      rows.push(row)
    })

    const csv =
      headers.map((h) => h.name).join(',') +
      '\n' +
      rows.map((row) => row.join(',')).join('\n')

    return csv
  })
