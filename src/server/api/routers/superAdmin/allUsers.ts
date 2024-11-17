import moment from 'moment'
import { z } from 'zod'

import { validateSuperAdminKey } from 'utils/validateSuperAdminKey'
import { superAdminProcedure } from '../../trpc'

export const allUsers = superAdminProcedure
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

    const userCount = await prisma.user.count()
    const userCountLastWeek = await prisma.user.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarHue: true,
        createdAt: true,
        _count: {
          select: {
            projectMemberships: true,
            notes: true,
            comments: true,
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

    if (users.length > limit) {
      const nextItem = users.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    return {
      users,
      userCount,
      userCountLastWeek,
      nextCursor,
    }
  })
