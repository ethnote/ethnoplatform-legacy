import { MetadataFieldVariant, ProjectRole } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { makeHandle } from 'utils/makeHandle'
import { protectedProcedure } from '../../trpc'

const metadataFieldSchema = z.object({
  name: z.string(),
  variant: z.string(),
  value: z.string().nullable().optional(),
  metadataFieldId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const noteFieldSchema = z.object({
  name: z.string(),
  content: z.string(),
  noteFieldId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const authorSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
})

const noteSchema = z.object({
  title: z.string(),
  author: authorSchema,
  files: z.array(z.unknown()), // adjust this based on the actual file type
  metadataFields: z.array(metadataFieldSchema),
  noteFields: z.array(noteFieldSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const projectSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  notes: z.array(noteSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const importJson = protectedProcedure
  .input(
    z.object({
      jsonString: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { jsonString } = input

    const json = projectSchema.parse(JSON.parse(jsonString))

    const handle = json.name
      ? await makeHandle(json.name, async (_handle) => {
          return !!(await ctx.prisma.project.findFirst({
            where: {
              handle: _handle,
            },
          }))
        })
      : undefined

    const defaultTemplate = {
      metadataFields: [],
      noteFields: [
        {
          id: nanoid(10),
          type: 'note',
          name: 'My Notes',
          templateName: DEFAULT_TEMPLATE_NAME,
        },
      ],
    }

    const project = await ctx.prisma.project.create({
      data: {
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
        name: json.name,
        description: json.description,
        handle,
        projectMemberships: {
          create: {
            projectRole: ProjectRole.PROJECT_OWNER,
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            invitationAcceptedAt: new Date(),
          },
        },
        template: defaultTemplate,
      },
    })

    for (const note of json.notes) {
      const noteHandle = note.title
        ? await makeHandle(note.title, async (_handle) => {
            return !!(await ctx.prisma.note.findFirst({
              where: {
                handle: _handle,
              },
            }))
          })
        : undefined

      // let author = await ctx.prisma.user.findFirst({
      //   // TODO: REMOVE THIS LATER
      //   where: {
      //     email: note.author.email.toLowerCase().trim(),
      //   },
      // })

      // if (!author) {
      //   author = await ctx.prisma.user.create({
      //     // TODO: REMOVE THIS LATER
      //     data: {
      //       fullName: note.author.fullName || '',
      //       email: note.author.email.toLowerCase().trim(),
      //     },
      //   })
      // }

      const createdNote = await ctx.prisma.note.create({
        data: {
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          templateVersion: project.templateVersion,
          templateName: DEFAULT_TEMPLATE_NAME,
          title: note.title,
          handle: noteHandle,
          projectId: project.id,
          authorId: ctx.session.user.id,
        },
      })

      let order = 0

      for (const metadataField of note.metadataFields) {
        await ctx.prisma.metadataField.create({
          data: {
            noteId: createdNote.id,
            metadataFieldId: metadataField.metadataFieldId,
            variant: metadataField.variant as unknown as MetadataFieldVariant,
            order,
            name: metadataField.name,
            value: metadataField.value,
          },
        })
        order++
      }

      order = 0

      for (const noteField of note.noteFields) {
        await ctx.prisma.noteField.create({
          data: {
            noteId: createdNote.id,
            name: noteField.name,
            order,
            content: toSlateElement(noteField.content),
            noteFieldId: noteField.noteFieldId,
            authorId: ctx.session.user.id,
          },
        })
        order++
      }
    }

    return project
  })

const toSlateElement = (note: string) => {
  const lines = note.split('\n')

  const elements = lines.map((line) => {
    return {
      type: 'paragraph',
      children: [
        {
          text: line,
        },
      ],
    }
  })

  return elements
}
