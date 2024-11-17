import { PrismaClient } from '@prisma/client'
import { projectInvitationNotification } from 'server/api/notifications/projectInvitationNotification'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const inviteMember = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      email: z.string().email(),
      name: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    return inviteEmail({
      prisma: ctx.prisma,
      userId: ctx.session.user.id,
      projectHandle: input.projectHandle,
      email: input.email,
      name: input.name,
    })
  })

export const inviteEmail = async ({
  prisma,
  projectHandle,
  email,
  name,
  userId,
}: {
  prisma: PrismaClient
  userId: string
  projectHandle: string
  email: string
  name: string | undefined
}) => {
  const project = await prisma.project.findFirst({
    where: {
      handle: projectHandle,
      projectMemberships: {
        some: {
          user: {
            id: userId, // Check if user is a member of the project
          },
          projectRole: {
            in: ['PROJECT_OWNER'], // Check if user is a project owner
          },
        },
      },
    },
  })

  if (!project) {
    throw new Error('Not authorized')
  }

  // Check if user is already a member
  const existingMembership = await prisma.projectMembership.findFirst({
    where: {
      project: {
        id: project.id,
      },
      user: {
        email: email.toLowerCase(),
      },
    },
  })

  if (existingMembership) {
    throw new Error('User is already a member')
  }

  const invitationSentById = userId as string

  // Create membership
  const membership = await prisma.projectMembership.create({
    data: {
      project: {
        connect: {
          id: project.id,
        },
      },
      invitationMailSentTo: email.toLowerCase(),
      invitationSentAt: new Date(),
      projectRole: 'MEMBER',
      invitationSentBy: {
        connect: {
          id: invitationSentById,
        },
      },
    },
  })

  await projectInvitationNotification({
    projectId: project.id,
    email: email.toLowerCase(),
    projectMembershipId: membership.id,
  })

  return membership
}
