import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getProject } from '../project/project'

export const getMentions = protectedProcedure
  .input(
    z.object({
      projectHandle: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const { projectHandle } = input

    if (!projectHandle) return null

    const project = await getProject({
      prisma: ctx.prisma,
      session: ctx.session,
      handle: projectHandle,
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const mentions = project.notes?.flatMap(
      (note) =>
        note.noteFields
          ?.filter((n) => n.isLatest)
          ?.flatMap((noteField) => noteField.mentions),
    )

    // Remove duplicates
    const uniqueMentions = [...new Set(mentions)]

    // Sort alphabetically
    const sortedMentions = uniqueMentions.sort()

    return sortedMentions
  })
