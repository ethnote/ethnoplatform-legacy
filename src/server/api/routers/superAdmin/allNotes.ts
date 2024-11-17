import moment from 'moment'
import { z } from 'zod'

import { validateSuperAdminKey } from 'utils/validateSuperAdminKey'
import { superAdminProcedure } from '../../trpc'

export const allNotes = superAdminProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      orderDirection: z.enum(['asc', 'desc']).nullish().optional(),
      orderBy: z.enum(['email', 'fullName', 'createdAt']).nullish().optional(),
      superAdminKey: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const limit = input.limit ?? 15
    const { cursor, superAdminKey } = input
    const { prisma, session } = ctx

    validateSuperAdminKey(session.user.id, superAdminKey)

    const noteCount = await prisma.note.count()
    const noteCountLastWeek = await prisma.note.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const notes = await prisma.note.findMany({
      select: {
        id: true,
        createdAt: true,
        title: true,
        _count: {
          select: {
            comments: true,
            files: true,
          },
        },
        files: {
          select: {
            size: true,
          },
        },
        author: {
          select: {
            email: true,
            fullName: true,
            avatarHue: true,
          },
        },
        handle: true,
        project: {
          select: {
            handle: true,
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

    if (notes.length > limit) {
      const nextItem = notes.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    const withTotalFileSize = notes.map((note) => {
      const totalFileSize = note.files.reduce((acc, file) => {
        return acc + file.size
      }, 0)

      return {
        ...note,
        totalFileSize,
      }
    })

    return {
      notes: withTotalFileSize,
      noteCount,
      noteCountLastWeek,
      nextCursor,
    }
  })
