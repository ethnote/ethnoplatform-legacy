import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getProject } from '../project/project'

export const getHashtags = protectedProcedure
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

    const hashtags = project.notes?.flatMap(
      (note) =>
        note.noteFields
          ?.filter((n) => n.isLatest)
          ?.flatMap((noteField) => noteField.hashtags),
    )

    // Remove duplicates
    const uniqueHashtags = [...new Set(hashtags)]

    // Sort alphabetically
    const sortedHashtags = uniqueHashtags.sort()

    return sortedHashtags
  })
