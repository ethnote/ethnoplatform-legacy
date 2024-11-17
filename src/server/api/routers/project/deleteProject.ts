import { env } from 'env.mjs'
import { deleteFile } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const deleteProject = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const project = await ctx.prisma.project.findFirst({
      where: {
        handle: input.projectHandle,
        projectMemberships: {
          some: {
            user: {
              id: ctx.session.user.id, // Check if user is a member of the project
            },
            projectRole: {
              in: ['PROJECT_OWNER'], // Check if user is a project owner
            },
          },
        },
      },
      include: {
        notes: {
          include: {
            files: true,
          },
        },
      },
    })

    if (!project) {
      throw new Error('Not authorized')
    }

    for (const file of project.notes.flatMap((note) => note.files)) {
      // Delete on S3
      try {
        await deleteFile(env.SERVER_AWS_S3_BUCKET_NAME!, `files/${file.id}`)
      } catch (error) {
        console.log(error)
      }
    }

    const deletedProject = await ctx.prisma.project.delete({
      where: {
        id: project.id,
      },
    })

    return deletedProject
  })
