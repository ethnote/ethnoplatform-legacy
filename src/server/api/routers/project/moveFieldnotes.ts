import { env } from 'env.mjs'
import { omit } from 'lodash'
import { nanoid } from 'nanoid'
import { copyFile } from 'server/storage'
import { z } from 'zod'

import { makeHandle } from 'utils/makeHandle'
import { protectedProcedure } from '../../trpc'

export const moveFieldnotes = protectedProcedure
  .input(
    z.object({
      fromProjectId: z.string(),
      toProjectId: z.string(),
      noteIds: z.array(z.string()),
      type: z.enum(['move', 'copy']),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { fromProjectId, toProjectId, noteIds, type } = input
    const { session, prisma } = ctx

    const fromProject = await prisma.project.findFirst({
      where: {
        id: fromProjectId,
        projectMemberships: {
          some: {
            user: {
              id: session.user.id,
            },
            projectRole: {
              in: ['PROJECT_OWNER'],
            },
          },
        },
      },
    })

    const toProject = await prisma.project.findFirst({
      where: {
        id: toProjectId,
        projectMemberships: {
          some: {
            user: {
              id: session.user.id,
            },
            projectRole: {
              in: ['PROJECT_OWNER'],
            },
          },
        },
      },
    })

    if (!fromProject || !toProject) {
      throw new Error('Not authorized')
    }

    const notes = await prisma.note.findMany({
      where: {
        id: {
          in: noteIds,
        },
        project: {
          id: fromProject.id,
        },
      },
      include: {
        metadataFields: true,
        noteFields: true,
        files: true,
      },
    })

    if (notes.length === 0) {
      throw new Error('No notes found')
    }

    if (type === 'move') {
      await Promise.all(
        notes.map(async (note) => {
          await prisma.note.update({
            where: {
              id: note.id,
            },
            data: {
              project: {
                connect: {
                  id: toProject.id,
                },
              },
            },
          })
        }),
      )
    } else {
      const newNotes = await Promise.all(
        notes.map(async (note) => {
          const handle = note.title
            ? await makeHandle(note.title, async (_handle) => {
                return !!(await ctx.prisma.note.findFirst({
                  where: {
                    handle: _handle,
                  },
                }))
              })
            : undefined

          return {
            newNote: await prisma.note.create({
              data: {
                ...omit(note, [
                  'id',
                  'noteFields',
                  'metadataFields',
                  'files',
                  'lockId',
                  'lockedByUserId',
                  'lockedAt',
                ]),
                handle,
                projectId: toProject.id,
              },
            }),
            oldNoteId: note.id,
          }
        }),
      )

      await Promise.all(
        notes.map(async (note) => {
          const newNoteId = newNotes.find((n) => n.oldNoteId === note.id)
            ?.newNote.id
          if (!newNoteId) return

          await prisma.metadataField.createMany({
            data: note.metadataFields.map((metadataField) => ({
              ...omit(metadataField, ['id']),
              noteId: newNoteId,
            })),
          })

          await prisma.noteField.createMany({
            data: note.noteFields.map((noteField) => ({
              ...omit(noteField, ['id']),
              content: noteField.content as any,
              prevContent: noteField.prevContent as any,
              noteId: newNoteId,
            })),
          })

          await Promise.all(
            note.files.map(async (file) => {
              const isImage = file.mimeType.startsWith('image')
              const bucket = env.SERVER_AWS_S3_BUCKET_NAME
              const thumbnailKey = nanoid(10)

              const newFile = await prisma.file.create({
                data: {
                  ...omit(file, ['id']),
                  noteId: newNoteId,
                  resizedKey: isImage ? 'files/' + thumbnailKey : null,
                },
              })

              try {
                await copyFile(
                  bucket,
                  'files/' + file.id, // fromKey,
                  bucket,
                  'files/' + newFile.id, // toKey,
                )

                if (isImage && file.resizedKey) {
                  await copyFile(
                    bucket,
                    file.resizedKey, // fromKey,
                    bucket,
                    'files/' + thumbnailKey, // toKey,
                  )
                }
              } catch (error) {
                console.log(error)
              }
            }),
          )
        }),
      )
    }

    await ctx.prisma.project.update({
      where: {
        id: fromProject.id,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    return true
  })
