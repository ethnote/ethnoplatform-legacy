import moment from 'moment'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateMetadataField = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      metadataFieldId: z.string(),
      value: z.string(),
      lockId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const note = await ctx.prisma.note.findFirst({
      where: {
        OR: [
          {
            id: input.id,
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
            id: input.id,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const isLocked = moment(note.lockedAt).isAfter(
      moment().subtract(5, 'minutes'),
    )

    if (isLocked && note.lockId !== input.lockId) {
      throw new Error('Note is locked. Please reload page')
    }

    const metadataField = await ctx.prisma.metadataField.findFirst({
      where: {
        metadataFieldId: input.metadataFieldId,
        noteId: note.id,
      },
    })

    if (!metadataField) {
      throw new Error('Metadata field not found')
    }

    await ctx.prisma.metadataField.update({
      where: {
        id: metadataField.id,
      },
      data: {
        value: input.value,
      },
    })

    // Update the note's updatedAt field
    await ctx.prisma.note.update({
      where: {
        id: note.id,
      },
      data: {
        updatedAt: new Date(),
        lockId: input.lockId,
        lockedAt: new Date(),
        lockedByUserId: ctx.session.user.id,
      },
    })

    await ctx.prisma.project.update({
      where: {
        id: note.projectId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return metadataField
  })
