import { ProjectRole } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { makeHandle } from 'utils/makeHandle'
import { protectedProcedure } from '../../trpc'
import { inviteEmail } from './inviteMember'

export const createProject = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      accessibilityLevel: z.string().optional(),
      invitedUserEmails: z.array(z.string().email()).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { name, description } = input

    const handle = input.name
      ? await makeHandle(input.name, async (_handle) => {
          return !!(await ctx.prisma.project.findFirst({
            where: {
              handle: _handle,
            },
          }))
        })
      : undefined

    if (!handle) {
      throw new Error('Handle could not be generated')
    }

    const DEFAULT_TEMPLATE = {
      metadataFields: [],
      noteFields: [
        {
          id: nanoid(10),
          type: 'note',
          name: 'My Notes',
          templateName: DEFAULT_TEMPLATE_NAME,
        },
      ],
    }

    const project = await ctx.prisma.project.create({
      data: {
        name,
        description,
        handle,
        projectMemberships: {
          create: {
            projectRole: ProjectRole.PROJECT_OWNER,
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            invitationAcceptedAt: new Date(),
          },
        },
        template: DEFAULT_TEMPLATE,
      },
    })

    for (const invitedUserEmail of input.invitedUserEmails ?? []) {
      await inviteEmail({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        projectHandle: handle,
        email: invitedUserEmail,
        name: undefined,
      })
    }

    return project
  })
