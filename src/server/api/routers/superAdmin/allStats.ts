import { times } from 'lodash'
import moment from 'moment'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const allStats = superAdminProcedure
  .input(
    z.object({
      dayInterval: z.number().min(1).max(20),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { prisma } = ctx
    const { dayInterval } = input

    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const noteCount = await prisma.note.count()
    const fileCount = await prisma.file.count()
    const totalFileSize = await prisma.file.aggregate({
      _sum: {
        size: true,
      },
    })

    const userCountLast30Days = await Promise.all(
      times(30).map(
        async (_, day) =>
          await prisma.user.count({
            where: {
              createdAt: {
                lte: moment()
                  .subtract(day * dayInterval, 'days')
                  .toDate(),
              },
            },
          }),
      ),
    )

    const projectCountLast30Days = await Promise.all(
      times(30).map(
        async (_, day) =>
          await prisma.project.count({
            where: {
              createdAt: {
                lte: moment()
                  .subtract(day * dayInterval, 'days')
                  .toDate(),
              },
            },
          }),
      ),
    )

    const noteCountLast30Days = await Promise.all(
      times(30).map(
        async (_, day) =>
          await prisma.note.count({
            where: {
              createdAt: {
                lte: moment()
                  .subtract(day * dayInterval, 'days')
                  .toDate(),
              },
            },
          }),
      ),
    )

    const fileCountLast30Days = await Promise.all(
      times(30).map(
        async (_, day) =>
          await prisma.file.count({
            where: {
              createdAt: {
                lte: moment()
                  .subtract(day * dayInterval, 'days')
                  .toDate(),
              },
            },
          }),
      ),
    )

    const totalFileSizeLast30Days = await Promise.all(
      times(30).map(
        async (_, day) =>
          await prisma.file.aggregate({
            _sum: {
              size: true,
            },
            where: {
              createdAt: {
                lte: moment()
                  .subtract(day * dayInterval, 'days')
                  .toDate(),
              },
            },
          }),
      ),
    )

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

    const userCountLastWeek = await prisma.user.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const projectCountLastWeek = await prisma.project.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const noteCountLastWeek = await prisma.note.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const fileCountLastWeek = await prisma.file.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
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

    return {
      userCount,
      userCountLast30Days,
      projectCount,
      projectCountLast30Days,
      noteCount,
      noteCountLast30Days,
      fileCount,
      fileCountLast30Days,
      totalFileSize,
      totalFileSizeLast30Days,
      imageCount,
      videoCount,
      PDFCount,
      audioCount,
      userCountLastWeek,
      projectCountLastWeek,
      noteCountLastWeek,
      fileCountLastWeek,
      totalFileSizeLastWeek,
    }
  })
