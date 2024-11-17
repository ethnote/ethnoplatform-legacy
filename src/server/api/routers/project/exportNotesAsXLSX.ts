import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import XLSX from 'xlsx'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getNotesAsJson } from './exportNotesAsJSON'

export const exportNotesAsXLSX = protectedProcedure
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

    const noteContent: Record<string, Record<string, any>> = {} // Contains content of note fields that are too long to fit in one cell

    projectWithNotes.notes.forEach((note) => {
      note.metadataFields.forEach((field) => {
        if (!headers.some((header) => header.id === field.metadataFieldId)) {
          headers.push({
            name: field.name,
            id: field.metadataFieldId,
          })
        }
      })

      for (let i = 0; i < note.noteFields.length; i++) {
        // note.noteFields.forEach((field) => {
        const field = note.noteFields[i]
        if (!field) return

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

            if (!headers.some((header) => header.id === id)) {
              headers.push({
                name: `${field.name} - ${note.templateName} ${
                  splitInto > 1 ? ` (${i + 1})` : ''
                }`,
                id,
              })
            }

            noteContent[note.id] = {
              ...noteContent[note.id],
              [id]: part,
            }
          }
        }
      }
    })

    projectWithNotes.notes.forEach((note) => {
      const row: string[] = []
      headers.forEach((header) => {
        const rowStartLength = row.length

        const content =
          note.metadataFields.find(
            (field) => field.metadataFieldId === header.id,
          )?.value || (header.id ? noteContent[note.id]?.[header.id] ?? '' : '')

        if (content) row.push(content)

        if (header.id === 'noteTitle') row.push(note.title)
        if (header.id === 'authorFullname')
          row.push(note.author?.fullName || '')
        if (header.id === 'authorEmail') row.push(note.author?.email || '')
        if (header.id === 'createdAt') row.push(note.createdAt.toISOString())
        if (header.id === 'updatedAt') row.push(note.updatedAt.toISOString())
        if (header.id === 'templateVersion')
          row.push(`${note.templateVersion}` || '0')
        if (header.id === 'templateName')
          row.push(`${note.templateName}` || DEFAULT_TEMPLATE_NAME)
        if (header.id === 'hashtags') {
          row.push(
            [...new Set(note.noteFields.flatMap((n) => n.hashtags))].join(', '),
          )
        }
        if (header.id === 'mentions') {
          row.push(
            [...new Set(note.noteFields.flatMap((n) => n.mentions))].join(', '),
          )
        }

        if (rowStartLength === row.length) row.push('')
      })
      rows.push(row)
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      headers.map((header) => header.name),
      ...rows,
    ] as any[])

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const base64 = XLSX.write(wb, {
      type: 'base64',
    })

    return base64
  })
