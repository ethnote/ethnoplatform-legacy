import moment from 'moment'
import { z } from 'zod'

import { validateSuperAdminKey } from 'utils/validateSuperAdminKey'
import { superAdminProcedure } from '../../trpc'

export const allProjects = superAdminProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
      orderDirection: z.enum(['asc', 'desc']).nullish().optional(),
      orderBy: z.enum(['name', 'createdAt']).nullish().optional(),
      showOnlyInactive: z.boolean().nullish().optional(),
      superAdminKey: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const limit = input.limit ?? 15
    const { cursor, superAdminKey } = input
    const { prisma, session } = ctx

    validateSuperAdminKey(session.user.id, superAdminKey)

    const projectCount = await prisma.project.count()
    const projectCountLastWeek = await prisma.project.count({
      where: {
        createdAt: {
          lte: moment().subtract(7, 'days').toDate(),
        },
      },
    })

    const projects = await prisma.project.findMany({
      where: {
        ...(!input.showOnlyInactive
          ? {}
          : {
              createdAt: {
                lte: moment().subtract(1, 'year').toDate(),
              },
              notes: {
                every: {
                  updatedAt: {
                    lte: moment().subtract(1, 'year').toDate(),
                  },
                },
              },
            }),
      },
      select: {
        id: true,
        createdAt: true,
        name: true,
        handle: true,
        _count: {
          select: {
            projectMemberships: true,
            notes: true,
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

    if (projects.length > limit) {
      const nextItem = projects.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    return {
      projects,
      projectCount,
      projectCountLastWeek,
      nextCursor,
    }
  })
