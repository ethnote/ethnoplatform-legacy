import { z } from 'zod'

import { makeHandle } from 'utils/makeHandle'
import { protectedProcedure } from '../../trpc'

export const movePersonalNote = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      title: z.string(),
      content: z.any(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { projectHandle, content } = input
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

    const note = await prisma.note.create({
      data: {
        templateVersion: 0,
        templateName: 'No template',
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

    await prisma.noteField.create({
      data: {
        noteId: note.id,
        noteFieldId: 'personalNote',
        order: 1,
        name: 'My notes',
        authorId: ctx.session.user.id,
        content,
      },
    })

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
