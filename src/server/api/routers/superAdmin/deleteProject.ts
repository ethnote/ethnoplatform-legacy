import { env } from 'env.mjs'
import { deleteFile } from 'server/storage'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const deleteProject = superAdminProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { projectId } = input

    const deletedProject = await prisma.project.delete({
      where: {
        id: projectId,
      },
      include: {
        notes: {
          include: {
            files: true,
          },
        },
      },
    })

    for (const file of deletedProject.notes.flatMap((note) => note.files)) {
      // Delete on S3
      try {
        await deleteFile(env.SERVER_AWS_S3_BUCKET_NAME!, `files/${file.id}`)
      } catch (error) {
        console.log(error)
      }
    }

    return {
      deletedProjetId: deletedProject.id,
    }
  })
