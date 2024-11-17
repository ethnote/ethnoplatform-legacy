import { PrismaClient, ProjectRole } from '@prisma/client'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const acceptTransferAllProjects = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { id } = input
    const { prisma } = ctx
    const { session } = ctx

    if (!session.user.email) {
      throw new Error('User email not found')
    }

    const projectTransferInvitation =
      await prisma.projectTransferInvitation.findFirst({
        where: {
          id,
          toEmail: session.user.email,
        },
      })

    if (!projectTransferInvitation) {
      throw new Error('This project transfer invitation does not exist')
    }

    if (!projectTransferInvitation?.fromUserId) {
      throw new Error(
        'This project transfer invitation does not have a fromUserId',
      )
    }

    await transferAllProjects({
      fromUserId: projectTransferInvitation.fromUserId,
      toUserId: session.user.id,
      prisma,
    })

    await prisma.projectTransferInvitation.delete({
      where: {
        id,
      },
    })
  })

export const transferAllProjects = async ({
  fromUserId,
  toUserId,
  prisma,
}: {
  fromUserId: string
  toUserId: string
  prisma: PrismaClient
}) => {
  const transferFromUser = await prisma.user.findFirst({
    where: {
      id: fromUserId,
    },
  })

  const transferToUser = await prisma.user.findFirst({
    where: {
      id: toUserId,
    },
  })

  if (!transferFromUser || !transferToUser) {
    throw new Error('This user does not exist')
  }

  const projectMemberships = await prisma.projectMembership.findMany({
    where: {
      userId: fromUserId,
    },
  })

  for (const fromMembership of projectMemberships) {
    const existingMembership = await prisma.projectMembership.findFirst({
      where: {
        userId: toUserId,
        projectId: fromMembership.projectId,
      },
    })

    if (!existingMembership) {
      await prisma.projectMembership.update({
        where: {
          id: fromMembership.id,
        },
        data: {
          userId: toUserId,
        },
      })
    } else {
      if (
        fromMembership?.projectRole === ProjectRole.PROJECT_OWNER &&
        existingMembership.projectRole !== ProjectRole.PROJECT_OWNER
      ) {
        await prisma.projectMembership.update({
          where: {
            id: existingMembership.id,
          },
          data: {
            projectRole: ProjectRole.PROJECT_OWNER,
          },
        })
      }

      await prisma.projectMembership.delete({
        where: {
          id: fromMembership.id,
        },
      })
    }
  }

  // Notes
  await prisma.note.updateMany({
    where: {
      authorId: fromUserId,
    },
    data: {
      authorId: toUserId,
    },
  })

  // NoteFields
  await prisma.noteField.updateMany({
    where: {
      authorId: fromUserId,
    },
    data: {
      authorId: toUserId,
    },
  })

  // Comments
  await prisma.comment.updateMany({
    where: {
      authorId: fromUserId,
    },
    data: {
      authorId: toUserId,
    },
  })

  // Notifications
  await prisma.notification.updateMany({
    where: {
      userId: fromUserId,
    },
    data: {
      userId: toUserId,
    },
  })

  //Concat personal notes
  const personalNotesConcat = [
    ...(JSON.parse(transferToUser.personalNotes || '[]') || []),
    ...(JSON.parse(transferFromUser?.personalNotes || '[]') || []),
  ]

  await prisma.user.update({
    where: {
      id: toUserId,
    },
    data: {
      personalNotes: JSON.stringify(personalNotesConcat),
    },
  })
}
