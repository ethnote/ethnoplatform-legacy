import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getProject } from '../project/project'

export const getSharedTags = protectedProcedure
  .input(
    z.object({
      projectId: z.string().optional(),
      metadataFieldId: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input.metadataFieldId || !input.projectId) return null

    const note = await ctx.prisma.note.findFirst({
      where: {
        projectId: input.projectId,
        metadataFields: {
          some: {
            metadataFieldId: input.metadataFieldId,
          },
        },
      },
      select: {
        project: {
          select: {
            handle: true,
          },
        },
      },
    })

    if (!note?.project?.handle) {
      throw new Error('Note not found')
    }

    const project = await getProject({
      prisma: ctx.prisma,
      session: ctx.session,
      handle: note?.project?.handle,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const sharedTags = project.notes?.flatMap(
      (note) =>
        note.metadataFields
          .filter(
            (metadataField) =>
              metadataField.metadataFieldId === input.metadataFieldId,
          )
          ?.map((metadataField) => metadataField.value?.split(';'))
          .flat(),
    )

    // Remove duplicates
    const uniqueSharedTags = [...new Set(sharedTags)]

    // Sort alphabetically
    const sortedSharedTags = uniqueSharedTags.sort()

    return sortedSharedTags
  })
