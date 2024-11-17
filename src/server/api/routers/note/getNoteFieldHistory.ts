import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const getNoteFieldHistory = protectedProcedure
  .input(
    z.object({
      noteId: z.string().optional(),
      noteFieldId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const noteFields = await ctx.prisma.noteField.findMany({
      where: {
        noteId: input.noteId,
        noteFieldId: input.noteFieldId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        instruction: true,
        createdAt: true,
        updatedAt: true,
        content: true,
        prevContent: true,
        isLatest: true,
        author: {
          select: {
            id: true,
            fullName: true,
            avatarHue: true,
          },
        },
      },
    })

    return noteFields
  })
