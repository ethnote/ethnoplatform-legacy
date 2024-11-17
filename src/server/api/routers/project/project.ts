import { AccessibilityLevel, PrismaClient, ProjectRole } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import { env } from 'env.mjs'
import { Session } from 'next-auth'
import { getOrCreatedSignedUrl } from 'server/storage'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const project = protectedProcedure
  .input(
    z.object({
      handle: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    if (!input.handle) return null

    return getProject({
      prisma: ctx.prisma,
      session: ctx.session,
      handle: input.handle,
    })
  })

export const getProject = async ({
  prisma,
  session,
  handle,
}: {
  prisma: PrismaClient
  session: Omit<Session, 'expires'> | null
  handle: string
  withHistory?: boolean
}) => {
  const isSuperAdmin = !!(await prisma.superAdmin.findFirst({
    where: {
      userId: session?.user.id,
    },
  }))

  const projectWithoutSignedUrl = await prisma.project.findFirst({
    where: {
      handle,
      ...(!isSuperAdmin
        ? {
            projectMemberships: {
              some: {
                userId: session?.user.id,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      handle: true,
      template: true,
      templateVersion: true,
      accessibilityLevel: true,
      timeFormat: true,
      textEditorHighlights: true,
      includeInfoText: true,
      noteNameTemplate: true,
      templateLockId: true,
      templateLockedAt: true,
      templateLockedByUser: {
        select: {
          fullName: true,
          avatarHue: true,
          email: true,
        },
      },
      projectMemberships: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              avatarHue: true,
              email: true,
            },
          },
          projectRole: true,
          invitationMailSentTo: true,
          invitationSentAt: true,
          invitationAcceptedAt: true,
        },
      },
      notes: {
        select: {
          id: true,
          handle: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          templateName: true,
          templateVersion: true,
          author: {
            select: {
              id: true,
              fullName: true,
              avatarHue: true,
              email: true,
            },
          },
          isVisible: true,
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
              note: {
                select: {
                  handle: true,
                  title: true,
                },
              },
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
              isLatest: true,
              content: true,
              hashtags: true,
              mentions: true,
            },
            where: {
              isLatest: true,
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
      },
    },
  })

  const { metadataFields, noteFields } = projectWithoutSignedUrl?.template as {
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

  const project = {
    templateNames,
    ...projectWithoutSignedUrl,
    notes: projectWithoutSignedUrl?.notes.map((note) => ({
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
    })),
  }

  // TODO: use filterNotesBasedOnVisibility
  const isProjectOwner = project?.projectMemberships?.some(
    (membership) =>
      membership?.user?.id === session?.user.id &&
      membership?.projectRole === ProjectRole.PROJECT_OWNER,
  )

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_AND_PROJECT_OWNER
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return isProjectOwner
      }),
    }
  }

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return note.isVisible
      }),
    }
  }

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return isProjectOwner && note.isVisible
      }),
    }
  }

  return project
}
