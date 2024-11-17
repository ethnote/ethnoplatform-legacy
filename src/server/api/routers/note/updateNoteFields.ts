import { MetadataFieldVariant } from '@prisma/client'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateNoteFields = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      fieldIdsToAdd: z.array(z.string()),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { id, fieldIdsToAdd } = input

    const note = await prisma.note.findFirst({
      where: {
        OR: [
          {
            id,
            project: {
              projectMemberships: {
                some: {
                  user: {
                    id: ctx.session.user.id,
                  },
                  projectRole: {
                    in: ['PROJECT_OWNER'],
                  },
                },
              },
            },
          },
          {
            id,
            authorId: ctx.session.user.id,
          },
        ],
      },
      include: {
        project: true,
        metadataFields: true,
        noteFields: true,
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const template = note.project?.template as {
      metadataFields: {
        id: string
        name: string
        templateName: string
        variant: MetadataFieldVariant
      }[]
      noteFields: {
        id: string
        name: string
        templateName: string
        instruction?: string
        variant: MetadataFieldVariant
      }[]
    } | null

    if (!template) {
      throw new Error('Template not found')
    }

    const _fieldIdsToAdd = fieldIdsToAdd.filter(
      (f) =>
        !note.metadataFields.find((m) => m.metadataFieldId === f) &&
        !note.noteFields.find((n) => n.noteFieldId === f),
    )

    const metadataFieldsToAdd = template.metadataFields.filter((f) =>
      _fieldIdsToAdd.includes(f.id),
    )
    const noteFieldsToAdd = template.noteFields.filter((f) =>
      _fieldIdsToAdd.includes(f.id),
    )

    if (!metadataFieldsToAdd.length && !noteFieldsToAdd.length) {
      throw new Error('No fields to add')
    }

    if (metadataFieldsToAdd.length > 0) {
      await Promise.all(
        metadataFieldsToAdd.map(async (m, i) => {
          await prisma.metadataField.create({
            data: {
              noteId: note.id,
              metadataFieldId: m.id,
              variant: m.variant,
              order: note.metadataFields.length + i,
              name: m.name,
            },
          })
        }),
      )
    }

    if (noteFieldsToAdd.length > 0) {
      await Promise.all(
        noteFieldsToAdd.map(async (n, i) => {
          await prisma.noteField.create({
            data: {
              noteId: note.id,
              noteFieldId: n.id,
              order: note.noteFields.length + i,
              name: n.name,
              instruction: n.instruction,
              authorId: ctx.session.user.id,
            },
          })
        }),
      )
    }

    await prisma.project.update({
      where: {
        id: note.projectId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return true
  })
