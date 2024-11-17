import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateUser = protectedProcedure
  .input(
    z.object({
      fullName: z.string().max(255).optional().nullable(),
      namePromptedAt: z.date().optional().nullable(),
      timestampShortcutCode: z.string().optional().nullable(),
      personalNotes: z.string().optional().nullable(),
      avatarHue: z.number().optional().nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const {
      fullName,
      namePromptedAt,
      timestampShortcutCode,
      personalNotes,
      avatarHue,
    } = input

    const user = await ctx.prisma.user.update({
      where: {
        id: ctx.session.user.id,
      },
      data: {
        fullName,
        namePromptedAt,
        timestampShortcutCode,
        personalNotes,
        avatarHue,
      },
    })

    return user
  })
