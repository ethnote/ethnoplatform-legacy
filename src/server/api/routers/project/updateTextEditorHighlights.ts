import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const updateTextEditorHighlights = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string(),
      textEditorHighlights: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z.string(),
          symbol: z.string(),
        }),
      ),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { textEditorHighlights } = input

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

    const updatedMembership = await ctx.prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        textEditorHighlights: textEditorHighlights as any,
      },
    })

    return updatedMembership
  })
