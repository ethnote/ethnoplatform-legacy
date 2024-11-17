import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateNoteAuthor = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      newAuthorId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { id, newAuthorId } = input

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
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const toUser = await prisma.user.findFirst({
      where: {
        id: newAuthorId,
        projectMemberships: {
          some: {
            projectId: note.projectId,
          },
        },
      },
    })

    if (!toUser) {
      throw new Error('New author not found')
    }

    // Notes
    const updateNote = await prisma.note.update({
      where: {
        id,
      },
      data: {
        authorId: toUser.id,
      },
    })

    // NoteFields
    await prisma.noteField.updateMany({
      where: {
        noteId: id,
      },
      data: {
        authorId: toUser.id,
      },
    })

    await prisma.project.update({
      where: {
        id: note.projectId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return updateNote
  })
