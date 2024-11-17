import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const addSuperAdmin = superAdminProcedure
  .input(
    z.object({
      email: z.string().email(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { email } = input

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const existingSuperAdmin = await prisma.superAdmin.findFirst({
      where: {
        userId: user.id,
      },
    })

    if (existingSuperAdmin) {
      throw new Error('User is already a super admin')
    }

    const superAdmin = await prisma.superAdmin.create({
      data: {
        userId: user.id,
      },
    })

    return superAdmin
  })
