import { env } from 'process'
import { createPresignedUrl } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const uploadFile = protectedProcedure
  .input(
    z.object({
      noteId: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
      duration: z.number().optional(),
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
          },
          {
            id: input.noteId,
            authorId: ctx.session.user.id,
          },
        ],
      },
    })

    if (!note) {
      throw new Error('Not authorized')
    }

    const file = await ctx.prisma.file.create({
      data: {
        mimeType: input.mimeType,
        size: input.size,
        name: input.filename,
        duration: input.duration,
        note: {
          connect: {
            id: note.id,
          },
        },
      },
    })

    // // Update the note's updatedAt field
    await ctx.prisma.note.update({
      where: {
        id: note.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    const signedUrl = createPresignedUrl(
      env.SERVER_AWS_S3_BUCKET_NAME!,
      `files/${file.id}`,
      'putObject',
    )

    return {
      signedUrl,
      file,
    }
  })
