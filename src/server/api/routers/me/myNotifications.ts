import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const myNotifications = publicProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(), // <-- "cursor" needs to exist, but can be any type
    }),
  )
  .query(async ({ input, ctx }) => {
    const limit = input.limit ?? 15
    const { cursor } = input
    const { prisma, session } = ctx

    if (!session) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        notificationsRead: true,
      },
    })

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        createdAt: true,
        type: true,
        comment: {
          select: {
            id: true,
            content: true,
            isReplyToId: true,
            author: {
              select: {
                fullName: true,
                avatarHue: true,
                email: true,
              },
            },
          },
        },
        note: {
          select: {
            handle: true,
            title: true,
          },
        },
        project: {
          select: {
            handle: true,
            name: true,
            setToBeDeletedAt: true,
          },
        },
        projectMembership: {
          select: {
            invitationAcceptedAt: true,
            invitationSentBy: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    })

    let nextCursor: typeof cursor | undefined = undefined

    if (notifications.length > limit) {
      const nextItem = notifications.pop()
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextCursor = nextItem!.id
    }

    return {
      notifications: notifications.map((n) => ({
        ...n,
        isRead: n.createdAt <= (user?.notificationsRead || new Date()),
      })),
      nextCursor,
    }
  })
