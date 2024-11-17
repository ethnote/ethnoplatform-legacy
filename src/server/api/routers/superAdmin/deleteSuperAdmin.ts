import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteSuperAdmin = superAdminProcedure
  .input(
    z.object({
      id: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { id } = input

    const superAdminCount = await prisma.superAdmin.count()

    if (superAdminCount === 1) {
      throw new Error('Cannot delete the only super admin')
    }

    const superAdmin = await prisma.superAdmin.delete({
      where: {
        id,
      },
    })

    return superAdmin
  })
