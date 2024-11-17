import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteUser = superAdminProcedure
  .input(
    z.object({
      userId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { userId } = input

    if (userId === ctx.session?.user.id) {
      throw new Error('You cannot delete yourself')
    }

    const deletedUser = await prisma.user.delete({
      where: {
        id: userId,
      },
    })

    return {
      deletedUser,
    }
  })
