import { PrismaClient } from '@prisma/client'
import { Session } from 'next-auth'

import { publicProcedure } from '../../trpc'

export const me = publicProcedure.query(async ({ ctx }) => {
  return getMe({ prisma: ctx.prisma, session: ctx.session })
})

export const getMe = async ({
  prisma,
  session,
}: {
  prisma: PrismaClient
  session: Omit<Session, 'expires'> | null
}) => {
  if (!session) {
    return null
  }

  const notificationLastSeenAt = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      notificationsRead: true,
    },
  })

  const me = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      fullName: true,
      namePromptedAt: true,
      personalNotes: true,
      avatarHue: true,
      projectMemberships: {
        select: {
          id: true,
          invitationAcceptedAt: true,
          projectRole: true,
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              updatedAt: true,
              handle: true,
              template: true,
              projectMemberships: {
                select: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      avatarHue: true,
                    },
                  },
                },
              },
              notes: {
                select: {
                  id: true,
                  title: true,
                  files: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      notifications: {
        where: {
          createdAt: {
            gt: notificationLastSeenAt?.notificationsRead ?? new Date(0),
          },
        },
      },
      timestampShortcutCode: true,
      projectTransferInvitations: {
        select: {
          id: true,
          createdAt: true,
          toEmail: true,
        },
      },
      didSeeWalkthrough: true,
    },
  })

  if (!me) return null

  const invitations = await prisma.projectMembership.findMany({
    where: {
      invitationMailSentTo: session.user.email,
      invitationAcceptedAt: null,
    },
    select: {
      id: true,
      invitationSentAt: true,
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          handle: true,
        },
      },
    },
  })

  const invitedToGetProjects = session.user.email
    ? await prisma.projectTransferInvitation.findMany({
        where: {
          toEmail: session.user.email,
        },
        select: {
          id: true,
          createdAt: true,
          fromUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          toEmail: true,
        },
      })
    : []

  const isSuperAdmin = !!(await prisma.superAdmin.findFirst({
    where: {
      userId: session.user.id,
    },
  }))

  return { ...me, invitations, isSuperAdmin, invitedToGetProjects }
}
