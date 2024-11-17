import { AccessibilityLevel, PrismaClient } from '@prisma/client'
import { env } from 'env.mjs'
import { Session } from 'next-auth'
import { getOrCreatedSignedUrl } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const note = protectedProcedure
  .input(
    z.object({
      handle: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input.handle) return null

    const note = await getNote({
      prisma: ctx.prisma,
      session: ctx.session,
      handle: input.handle,
    })

    if (!note) {
      throw new Error('Note not found')
    }

    return note
  })

export const getNote = async ({
  prisma,
  session,
  handle,
}: {
  prisma: PrismaClient
  session: Omit<Session, 'expires'> | null
  handle: string
}) => {
  const isSuperAdmin = !!(await prisma.superAdmin.findFirst({
    where: {
      userId: session?.user.id,
    },
  }))

  const note = await prisma.note.findFirst({
    where: {
      handle,
      ...(!isSuperAdmin
        ? {
            project: {
              projectMemberships: {
                some: {
                  userId: session?.user.id,
                },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      handle: true,
      templateVersion: true,
      templateName: true,
      isVisible: true,
      project: {
        select: {
          id: true,
          handle: true,
          name: true,
          description: true,
          accessibilityLevel: true,
          projectMemberships: {
            select: {
              id: true,
              userId: true,
              projectRole: true,
            },
          },
        },
      },
      author: {
        select: {
          id: true,
          fullName: true,
          avatarHue: true,
        },
      },
      metadataFields: {
        select: {
          id: true,
          variant: true,
          name: true,
          metadataFieldId: true,
          value: true,
          order: true,
        },
      },
      noteFields: {
        select: {
          id: true,
          name: true,
          instruction: true,
          content: true,
          noteFieldId: true,
          order: true,
        },
        where: {
          isLatest: true, // Important to avoid returning old versions of note fields
        },
      },
      files: {
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          createdAt: true,
          caption: true,
          duration: true,
          resizedKey: true,
          blurhash: true,
        },
      },
      comments: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          content: true,
          isEdited: true,
          author: {
            select: {
              id: true,
              fullName: true,
              avatarHue: true,
            },
          },
          isReplyToId: true,
          contentJson: true,
        },
      },
      lockId: true,
      lockedByUser: {
        select: {
          id: true,
          fullName: true,
          avatarHue: true,
          email: true,
        },
      },
      lockedAt: true,
    },
  })

  const withSignedUrls = {
    ...note,
    files: note?.files.map((file) => ({
      ...file,
      signedUrl: getOrCreatedSignedUrl(
        env.SERVER_AWS_S3_BUCKET_NAME,
        `files/${file.id}`,
        'getObject',
      ),
      thumbnail: file.resizedKey
        ? getOrCreatedSignedUrl(
            env.SERVER_AWS_S3_BUCKET_NAME,
            file.resizedKey,
            'getObject',
          )
        : null,
    })),
  }

  const couldBeHidden =
    note?.project?.accessibilityLevel &&
    (
      [
        AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL,
        AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER,
      ] as AccessibilityLevel[]
    ).includes(note.project?.accessibilityLevel)

  if (
    couldBeHidden &&
    !note?.isVisible &&
    note?.author?.id !== session?.user.id &&
    !isSuperAdmin
  ) {
    throw new Error('Note not found')
  }

  return withSignedUrls
}
