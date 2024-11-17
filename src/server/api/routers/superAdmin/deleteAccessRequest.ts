import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteAccessRequest = superAdminProcedure
  .input(
    z.object({
      accessRequestId: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { accessRequestId } = input

    const accessRequest = await prisma.accessRequest.delete({
      where: {
        id: accessRequestId,
      },
    })

    return accessRequest
  })
