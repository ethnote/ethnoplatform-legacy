import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const superAdmin = superAdminProcedure
  .input(
    z.object({
      id: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { id } = input

    const superAdmin = await prisma.superAdmin.findFirst({
      where: {
        id,
      },
    })

    return superAdmin
  })
