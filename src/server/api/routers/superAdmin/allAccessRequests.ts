import moment from 'moment'
import { z } from 'zod'

import { superAdminProcedure } from '../../trpc'

export const allAccessRequests = superAdminProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      orderDirection: z.enum(['asc', 'desc']).nullish().optional(),
      orderBy: z.enum(['email', 'fullName', 'createdAt']).nullish().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const limit = input.limit ?? 15
    const { cursor } = input
    const { prisma } = ctx

    const accessRequestCount = await prisma.accessRequest.count({
      where: {
        isAccepted: false,
      },
    })
    const accessRequestCountLastWeek = await prisma.accessRequest.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
        isAccepted: false,
      },
    })

    const accessRequests = await prisma.accessRequest.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        institution: true,
        intendedUse: true,
        nameOfInitialProject: true,
      },
      where: {
        isAccepted: false,
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        [input.orderBy ?? 'createdAt']: input.orderDirection ?? 'desc',
      },
    })

    let nextCursor: typeof cursor | undefined = undefined

    if (accessRequests.length > limit) {
      const nextItem = accessRequests.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    return {
      accessRequests,
      accessRequestCount,
      accessRequestCountLastWeek,
      nextCursor,
    }
  })
