import { MetadataFieldVariant, ProjectRole } from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from 'server/db'

import { makeHandle } from 'utils/makeHandle'

export const createDemoProject = async (userId: string) => {
  const name = 'My First Project'

  const handle = name
    ? await makeHandle(name, async (_handle) => {
        return !!(await prisma.project.findFirst({
          where: {
            handle: _handle,
          },
        }))
      })
    : undefined

  const locationMetadataFieldId = nanoid(10)
  const noteFieldId = nanoid(10)

  const template = {
    metadataFields: [
      {
        id: locationMetadataFieldId,
        variant: 'LOCATION',
        name: 'Location',
        templateName: 'My First Template',
      },
    ],
    noteFields: [
      {
        id: noteFieldId,
        variant: 'NOTE',
        name: 'My Notes',
        templateName: 'My First Template',
      },
    ],
    templateName: 'My First Template',
  } as {
    metadataFields: {
      id: string
      variant: MetadataFieldVariant
      name: string
      templateName: string
    }[]
    noteFields: {
      id: string
      variant: MetadataFieldVariant
      name: string
      templateName: string
    }[]
    templateName: string
  }

  await prisma.project.create({
    data: {
      name,
      handle,
      projectMemberships: {
        create: {
          projectRole: ProjectRole.PROJECT_OWNER,
          user: {
            connect: {
              id: userId,
            },
          },
          invitationAcceptedAt: new Date(),
        },
      },
      template,
      notes: {
        create: [
          {
            authorId: userId,
            title: 'My First Note',
            handle: `my-first-note-${nanoid(10)}`,
            templateVersion: 1,
            templateName: 'My First Template',
            noteFields: {
              create: [
                {
                  id: nanoid(10),
                  authorId: userId,
                  order: 0,
                  isLatest: true,
                  name: 'My Notes',
                  hashtags: ['hashtags'],
                  mentions: ['mentions'],
                  noteFieldId: noteFieldId,
                  content: [
                    {
                      type: 'paragraph',
                      children: [
                        { text: 'This is your note area. You can also write ' },
                        {
                          type: 'hashtag',
                          hashtag: 'hashtags',
                          children: [{ text: '#hashtags' }],
                        },
                        { text: ' and ' },
                        {
                          type: 'mention',
                          hashtag: 'mentions',
                          children: [{ text: '@mentions' }],
                        },
                        { text: '.' },
                      ],
                    },
                  ],
                },
              ],
            },
            metadataFields: {
              create: [
                {
                  order: 0,
                  name: 'Location',
                  variant: 'LOCATION',
                  value: '55.68734108347068, 12.57067670143132',
                  metadataFieldId: locationMetadataFieldId,
                },
              ],
            },
          },
        ],
      },
    },
  })
}
