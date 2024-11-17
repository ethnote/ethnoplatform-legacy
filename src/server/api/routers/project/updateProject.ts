import { AccessibilityLevel, TimeFormat } from '@prisma/client'
import moment from 'moment'
import { templateZod } from 'server/api/zodTypes/template.zod'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateProject = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      template: templateZod,
      accessibilityLevel: z.string().optional(),
      timeFormat: z.string().optional(),
      includeInfoText: z.boolean().optional(),
      noteNameTemplate: z.string().optional(),
      templateLockId: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const project = await ctx.prisma.project.findFirst({
      where: {
        handle: input.projectHandle,
        projectMemberships: {
          some: {
            user: {
              id: ctx.session.user.id, // Check if user is a member of the project
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

    const isLocked =
      input.template &&
      moment(project.templateLockedAt).isAfter(moment().subtract(5, 'minutes'))

    if (isLocked && project.templateLockId !== input.templateLockId) {
      throw new Error('Template is locked. Please reload page')
    }

    const updatedProject = await ctx.prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        name: input.name,
        description: input.description,
        template: input.template,
        templateVersion: input.template
          ? project.templateVersion + 1
          : undefined,
        accessibilityLevel: input.accessibilityLevel as
          | AccessibilityLevel
          | undefined,
        timeFormat: input.timeFormat as TimeFormat | undefined,
        includeInfoText: !!input.includeInfoText,
        noteNameTemplate: input.noteNameTemplate,
        templateLockId: input.templateLockId,
      },
    })

    return updatedProject
  })
