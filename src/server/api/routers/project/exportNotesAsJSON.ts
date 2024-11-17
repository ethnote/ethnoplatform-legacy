import { PrismaClient } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { omit } from 'lodash'
import { Session } from 'next-auth'
import { filterNotesBasedOnVisibility } from 'server/api/prismaUtils/filterNotesBasedOnVisibility'
import { Descendant, Node } from 'slate'
import { z } from 'zod'

import { projectMetadataFields, projectNoteFields } from 'utils/template'
import { protectedProcedure } from '../../trpc'

export const exportNotesAsJSON = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      noteIds: z.array(z.string()),
      includeInfoText: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    return getNotesAsJson({
      prisma: ctx.prisma,
      session: ctx.session,
      projectId: input.projectId,
      noteIds: input.noteIds,
      includeInfoText: input.includeInfoText,
    })
  })

export const getNotesAsJson = async ({
  prisma,
  session,
  projectId,
  noteIds,
  includeInfoText,
}: {
  prisma: PrismaClient
  session: Omit<Session, 'expires'> | null
  projectId: string
  noteIds: string[]
  includeInfoText?: boolean
}) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      projectMemberships: {
        some: {
          user: {
            id: session?.user.id, // Check if user is a member of the project
          },
        },
      },
    },
    select: {
      name: true,
      description: true,
      notes: {
        select: {
          id: true,
          title: true,
          author: {
            select: {
              fullName: true,
              email: true,
            },
          },
          files: {
            select: {
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          metadataFields: {
            select: {
              name: true,
              variant: true,
              value: true,
              metadataFieldId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          noteFields: {
            select: {
              name: true,
              instruction: true,
              content: true,
              noteFieldId: true,
              createdAt: true,
              updatedAt: true,
              hashtags: true,
              mentions: true,
            },
            where: {
              isLatest: true,
            },
          },
          createdAt: true,
          updatedAt: true,
          templateVersion: true,
          templateName: true,
        },
        where: {
          id: {
            in: noteIds,
          },
        },
      },
      template: true,
      templateVersion: true,
      projectMemberships: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          projectRole: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  const filteredNotes = filterNotesBasedOnVisibility(
    session,
    project,
  ) as typeof project

  type Paragraph = {
    type: 'paragraph'
    children: {
      bold: boolean
      text: string
      italic: boolean
      underline: boolean
    }[]
  }

  const serialize = (nodes: Descendant[]) => {
    return nodes
      ?.map((n) => {
        const node = n as Paragraph
        return node?.children
          .map((c) => {
            let text = Node.string(c)

            if (text === ' ') return text

            let formattingLetter = ''

            if (c.bold) {
              formattingLetter += 'b'
            }
            if (c.italic) {
              formattingLetter += 'i'
            }
            if (c.underline) {
              formattingLetter += 'u'
            }

            if (formattingLetter) {
              text = `<${formattingLetter}>${text}</${formattingLetter}>`
            }

            return text
          })
          .join('')
      })
      .join('\n')
    // return nodes?.map((n) => Node.string(n)).join('\n') // Old
  }

  const sortedNotes = noteIds
    .map((id) => filteredNotes?.notes.find((n) => n.id === id))
    .filter(Boolean)

  // Replace bold with <b>text</b>
  // Replace italix with <i>text</i>
  // Replace underline with <u>text</u>

  const serializedNotes = {
    ...filteredNotes,
    notes: sortedNotes?.map((note) => ({
      ...note,
      metadataFields: note?.metadataFields
        .filter(
          (m) => !(['INFO_TEXT'].includes(m.variant) && !includeInfoText), // Remove info text fields from export
        )
        .map((m) =>
          m.variant === 'SHARED_TAGS'
            ? { ...m, value: m.value?.replace(/;/g, ', ') }
            : m,
        ), // Replace semicolon with comma in shared tags
      noteFields: note?.noteFields
        ?.map((noteField) => ({
          ...noteField,
          content: noteField?.content
            ? serialize(noteField?.content as unknown as Descendant[])
            : '',
        }))
        .map((n) =>
          includeInfoText ? n : (omit(n, ['instruction']) as typeof n),
        ),
    })),
  } as typeof filteredNotes & {
    notes: (typeof filteredNotes)['notes'] &
      {
        noteFields: (typeof filteredNotes)['notes'][0]['noteFields'] & {
          content: string
        }
      }[]
  }

  const { metadataFields, noteFields } = project?.template as {
    metadataFields: {
      id: string
      templateName: string
    }[]
    noteFields: {
      id: string
      templateName: string
    }[]
  }

  const templateNames = [
    ...new Set([
      ...[...metadataFields, ...noteFields].map(
        (f) => f?.templateName || DEFAULT_TEMPLATE_NAME,
      ),
    ]),
  ].filter(Boolean) as string[]

  const templates = templateNames.reduce(
    (acc, templateName) => ({
      ...acc,
      [templateName]: {
        metadataFields: projectMetadataFields(project, templateName),
        noteFields: projectNoteFields(project, templateName),
      },
    }),
    {},
  )

  const cleanedNotes = omit(serializedNotes, ['template'])

  return { templates, ...cleanedNotes }
}
