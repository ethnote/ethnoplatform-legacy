import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const searchForUserEmails = superAdminProcedure
  .input(
    z.object({
      searchWord: z.string().nullish().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { searchWord } = input
    const { prisma } = ctx

    const users = await prisma.user.findMany({
      where: {
        email: {
          ...(searchWord ? { contains: searchWord } : undefined),
        },
      },
      select: {
        id: true,
        email: true,
      },
      take: 10,
    })

    return users
  })
