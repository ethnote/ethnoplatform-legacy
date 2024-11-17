import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteNote = superAdminProcedure
  .input(
    z.object({
      noteId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { noteId } = input

    const deletedNote = await prisma.note.delete({
      where: {
        id: noteId,
      },
    })

    return {
      deletedNote,
    }
  })
