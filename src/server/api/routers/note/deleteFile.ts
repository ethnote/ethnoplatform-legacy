import { env } from 'env.mjs'
import { deleteFile as s3DeleteFile } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const deleteFile = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const file = await ctx.prisma.file.findFirst({
      where: {
        id: input.id,
      },
      include: {
        note: true,
      },
    })

    if (!file) {
      throw new Error('Not authorized')
    }

    const note = await ctx.prisma.note.findFirst({
      where: {
        OR: [
          {
            id: file?.noteId,
            project: {
              projectMemberships: {
                some: {
                  user: {
                    id: ctx.session.user.id,
                  },
                  projectRole: {
                    in: ['PROJECT_OWNER'],
                  },
                },
              },
            },
          },
          {
            id: file?.noteId,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    // Delete on S3
    try {
      await s3DeleteFile(env.SERVER_AWS_S3_BUCKET_NAME!, `files/${file.id}`)
    } catch (error) {
      console.log(error)
      // throw new Error('Error deleting file')
    }

    const deletedFile = await ctx.prisma.file.delete({
      where: {
        id: file.id,
      },
    })

    return deletedFile
  })
