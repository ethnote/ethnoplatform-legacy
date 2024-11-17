import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getNote } from '../note/note'

export const comments = protectedProcedure
  .input(
    z.object({
      handle: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input.handle) return null

    const note = await getNote({
      prisma: ctx.prisma,
      session: ctx.session,
      handle: input.handle,
    })

    if (!note) {
      throw new Error('Note not found')
    }

    return note.comments
  })
