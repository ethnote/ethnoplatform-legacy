import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteFile = superAdminProcedure
  .input(
    z.object({
      fileId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { fileId } = input

    const deletedFile = await prisma.file.delete({
      where: {
        id: fileId,
      },
    })

    return {
      deletedFile,
    }
  })
