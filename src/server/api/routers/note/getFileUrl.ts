import { env } from 'process'
import { createPresignedUrl } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const getFileUrl = protectedProcedure
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
        id: file?.noteId,
        project: {
          projectMemberships: {
            some: {
              user: {
                id: ctx.session.user.id,
              },
            },
          },
        },
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const signedUrl = createPresignedUrl(
      env.SERVER_AWS_S3_BUCKET_NAME!,
      `files/${file.id}`,
      'getObject',
    )

    return {
      signedUrl,
      file,
    }
  })
