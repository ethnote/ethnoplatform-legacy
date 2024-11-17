import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { z } from 'zod'

import { makeHandle } from 'utils/makeHandle'
import { projectMetadataFields, projectNoteFields } from 'utils/template'
import { protectedProcedure } from '../../trpc'

export const createNote = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      title: z.string(),
      templateName: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectHandle, templateName } = input
    const { session, prisma } = ctx

    const project = await prisma.project.findFirst({
      where: {
        handle: projectHandle,
        projectMemberships: {
          some: {
            user: {
              id: ctx.session.user.id,
            },
          },
        },
      },
    })

    if (!project) {
      throw new Error('Not authorized')
    }

    const handle = input.title
      ? await makeHandle(input.title, async (_handle) => {
          return !!(await ctx.prisma.note.findFirst({
            where: {
              handle: _handle,
            },
          }))
        })
      : undefined

    if (!project.template) {
      throw new Error('Template needed to create note')
    }

    const metadataFields = projectMetadataFields(project, templateName)
    const noteFields = projectNoteFields(project, templateName)

    const note = await prisma.note.create({
      data: {
        templateVersion: project.templateVersion,
        templateName: templateName ?? DEFAULT_TEMPLATE_NAME,
        title: input.title,
        handle,
        project: {
          connect: {
            id: project.id,
          },
        },
        author: {
          connect: {
            id: session.user.id,
          },
        },
      },
    })

    if (metadataFields) {
      metadataFields.map(async (m: any) => {
        await prisma.metadataField.create({
          data: {
            noteId: note.id,
            metadataFieldId: m.id,
            variant: m.variant,
            order: m.order,
            name: m.name,
          },
        })
      })
    }

    if (noteFields) {
      noteFields.map(async (n: any) => {
        await prisma.noteField.create({
          data: {
            noteId: note.id,
            noteFieldId: n.id,
            order: n.order,
            name: n.name,
            instruction: n.instruction,
            authorId: ctx.session.user.id,
          },
        })
      })
    }

    await ctx.prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return note
  })
