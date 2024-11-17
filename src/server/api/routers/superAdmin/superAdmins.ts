import { z } from 'zod'

import { validateSuperAdminKey } from 'utils/validateSuperAdminKey'
import { superAdminProcedure } from '../../trpc'

export const superAdmins = superAdminProcedure
  .input(
    z.object({
      superAdminKey: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { superAdminKey } = input
    const { prisma, session } = ctx

    validateSuperAdminKey(session.user.id, superAdminKey)

    const superAdmin = await prisma.superAdmin.findMany({
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            fullName: true,
            avatarHue: true,
            createdAt: true,
          },
        },
      },
    })

    return superAdmin
  })
