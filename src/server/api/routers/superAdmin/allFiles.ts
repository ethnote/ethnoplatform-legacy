import { env } from 'env.mjs'
import moment from 'moment'
import { getOrCreatedSignedUrl } from 'server/storage'
import { z } from 'zod'

import { validateSuperAdminKey } from 'utils/validateSuperAdminKey'
import { superAdminProcedure } from '../../trpc'

export const allFiles = superAdminProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      orderDirection: z.enum(['asc', 'desc']).nullish().optional(),
      orderBy: z.enum(['name', 'createdAt']).nullish().optional(),
      superAdminKey: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const limit = input.limit ?? 15
    const { cursor, superAdminKey } = input
    const { prisma, session } = ctx

    validateSuperAdminKey(session.user.id, superAdminKey)

    const fileCount = await prisma.file.count()
    const fileCountLastWeek = await prisma.file.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })
    const totalFileSize = await prisma.file.aggregate({
      _sum: {
        size: true,
      },
    })
    const totalFileSizeLastWeek = await prisma.file.aggregate({
      _sum: {
        size: true,
      },
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })
    const imageCount = await prisma.file.count({
      where: {
        mimeType: {
          contains: 'image',
        },
      },
    })
    const videoCount = await prisma.file.count({
      where: {
        mimeType: {
          contains: 'video',
        },
      },
    })
    const PDFCount = await prisma.file.count({
      where: {
        mimeType: {
          contains: 'pdf',
        },
      },
    })
    const audioCount = await prisma.file.count({
      where: {
        mimeType: {
          contains: 'audio',
        },
      },
    })

    const files = await prisma.file.findMany({
      select: {
        id: true,
        createdAt: true,
        name: true,
        size: true,
        mimeType: true,
        resizedKey: true,
        blurhash: true,
        note: {
          select: {
            handle: true,
            project: {
              select: {
                handle: true,
              },
            },
          },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        [input.orderBy ?? 'createdAt']: input.orderDirection ?? 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined

    if (files.length > limit) {
      const nextItem = files.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    const withSignedUrls = files?.map((file) => ({
      ...file,
      signedUrl: getOrCreatedSignedUrl(
        env.SERVER_AWS_S3_BUCKET_NAME,
        `files/${file.id}`,
        'getObject',
      ),
      thumbnail: file.resizedKey
        ? getOrCreatedSignedUrl(
            env.SERVER_AWS_S3_BUCKET_NAME,
            file.resizedKey,
            'getObject',
          )
        : null,
    }))

    return {
      files: withSignedUrls,
      fileCount,
      fileCountLastWeek,
      totalFileSize,
      totalFileSizeLastWeek,
      imageCount,
      videoCount,
      PDFCount,
      audioCount,
      nextCursor,
    }
  })
