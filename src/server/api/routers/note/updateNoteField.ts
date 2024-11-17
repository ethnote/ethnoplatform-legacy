import { NOTE_HISTORY_INTERVAL } from 'constants/constants'
import moment from 'moment'
import { z } from 'zod'

import { getHashtags, getMentions } from 'utils/slate'
import { protectedProcedure } from '../../trpc'

export const updateNoteField = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      noteFieldId: z.string(),
      content: z.any(),
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

    const noteField = await ctx.prisma.noteField.findFirst({
      where: {
        noteFieldId: input.noteFieldId,
        noteId: note.id,
        isLatest: true,
      },
    })

    if (!noteField) {
      throw new Error('Note field not found')
    }

    if (JSON.stringify(noteField.content) === JSON.stringify(input.content)) {
      return noteField
    }

    const hashtags = getHashtags(input.content)
    const mentions = getMentions(input.content)

    // If the note field is more than 5 minutes old, create a new note
    if (
      noteField.createdAt.getTime() <
      new Date().getTime() - NOTE_HISTORY_INTERVAL
    ) {
      // Update all old notes - there should only be one old not, but a bug could cause more than one
      await ctx.prisma.noteField.updateMany({
        where: {
          noteFieldId: noteField.noteFieldId,
          noteId: note.id,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      })

      const newNoteField = await ctx.prisma.noteField.create({
        data: {
          noteId: note.id,
          noteFieldId: noteField.noteFieldId,
          order: noteField.order,
          name: noteField.name,
          instruction: noteField.instruction,
          content: input.content,
          authorId: ctx.session.user.id,
          prevContent: noteField.content as any,
          hashtags,
          mentions,
          isLatest: true,
        },
      })

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

      return newNoteField
    } else {
      const newNoteField = await ctx.prisma.noteField.update({
        where: {
          id: noteField.id,
        },
        data: {
          content: input.content,
          hashtags,
          mentions,
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

      return newNoteField
    }
  })
