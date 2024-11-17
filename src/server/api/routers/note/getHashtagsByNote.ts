import { z } from 'zod'

import { protectedProcedure } from '../../trpc'
import { getProject } from '../project/project'

export const getHashtagsByNote = protectedProcedure
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

    const hashtags = project.notes?.map((note) => ({
      hashtags: note.noteFields
        ?.filter((n) => n.isLatest)
        ?.flatMap((noteField) => noteField.hashtags),
      note: note,
    }))

    return {
      projectName: project.name,
      hashtags,
    }
  })
