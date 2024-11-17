import { env } from 'process'
import { nanoid } from 'nanoid'
import { scaleAndReturnBlurhash } from 'server/imageProcessing/scaleAndReturnBlurhash'
import { createPresignedUrl } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const uploadFileCompleted = protectedProcedure
  .input(
    z.object({
      noteId: z.string(),
      fileId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const note = await ctx.prisma.note.findFirst({
      where: {
        OR: [
          {
            id: input.noteId,
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
            files: {
              some: {
                id: input.fileId,
              },
            },
          },
          {
            id: input.noteId,
            authorId: ctx.session.user.id,
            files: {
              some: {
                id: input.fileId,
              },
            },
          },
        ],
      },
    })

    const file = await ctx.prisma.file.findFirst({
      where: {
        id: input.fileId,
      },
    })

    if (!note || !file) {
      throw new Error('Not authorized')
    }

    const updatedFile = await ctx.prisma.file.update({
      where: {
        id: file.id,
      },
      data: {
        fileIsUploaded: true,
      },
    })

    if (file.mimeType.startsWith('image/')) {
      const signedUrl = createPresignedUrl(
        env.SERVER_AWS_S3_BUCKET_NAME!,
        `files/${file.id}`,
        'getObject',
      )

      const resizedKey = `files/${nanoid(10)}`

      const blurhash = await scaleAndReturnBlurhash(signedUrl, resizedKey)

      return await ctx.prisma.file.update({
        where: {
          id: file.id,
        },
        data: {
          resizedKey,
          blurhash: blurhash ?? undefined,
        },
      })
    }

    return updatedFile
  })
