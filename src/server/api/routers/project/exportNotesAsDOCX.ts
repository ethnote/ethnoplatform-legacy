import { MetadataFieldVariant } from '@prisma/client'
import { Document, Packer, Paragraph, TextRun, UnderlineType } from 'docx'
import moment from 'moment'
import { z } from 'zod'

import { mapMetadataFieldNames } from 'components/note/TemplateBlock'
import { protectedProcedure } from '../../trpc'
import { getNotesAsJson } from './exportNotesAsJSON'

export const exportNotesAsDOCX = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      noteIds: z.array(z.string()),
      includeInfoText: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const projectWithNotes = await getNotesAsJson({
      prisma: ctx.prisma,
      session: ctx.session,
      projectId: input.projectId,
      noteIds: input.noteIds,
      includeInfoText: input.includeInfoText,
    })

    const paragraph = (title: string | null, content: string) => {
      return new Paragraph({
        children: [
          title &&
            new TextRun({
              break: 1,
              text: `${title}: `,
              bold: true,
              font: 'Arial',
            }),
          new TextRun({
            break: 1,
            text: '',
          }),
          ...content.split('\n').flatMap((line) => {
            // Might be a bit overengineered -> Alternatively just use the rich text JSON

            // Format bold, italic and underline
            // <b | i | u></b | i | u> -> Bold | Italic | Underline

            const tagRegex = /(<[a-zA-Z]+>.*?<\/[a-zA-Z]+>)/
            const tagTypeRegex = /<([a-zA-Z]+)>/g
            const parts = line.split(tagRegex)

            return [
              ...parts.map((part) => {
                const tagParts = part.split(tagTypeRegex)
                const tagType = tagParts[1]?.replace(/[<>]/g, '')
                const removeTagRegex = /<([a-zA-Z]+)>(.*?)<\/\1>/g

                if (tagType) {
                  return new TextRun({
                    break: 0,
                    text: `${part.replace(removeTagRegex, '$2')}`,
                    font: 'Arial',
                    bold: tagType.includes('b'),
                    italics: tagType.includes('i'),
                    underline: tagType.includes('u')
                      ? {
                          color: '000000',
                          type: UnderlineType.SINGLE,
                        }
                      : undefined,
                  })
                } else {
                  return new TextRun({
                    break: 0,
                    text: `${part}`,
                    font: 'Arial',
                  })
                }
              }),
              new TextRun({
                break: 1,
                text: '',
                font: 'Arial',
              }),
            ]

            // return new TextRun({
            //   break: 1,
            //   text: `${line}`,
            //   font: 'Arial',
            // })
          }),
        ].filter(Boolean) as TextRun[],
      })
    }

    const newLine = new Paragraph({
      children: [
        new TextRun({
          text: '',
        }),
      ],
    })

    // Divide line
    const line = new Paragraph({
      children: [
        new TextRun({
          text: '____________________________________________________',
          font: 'Arial',
        }),
      ],
    })

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Project: ${projectWithNotes.name}`,
                  bold: true,
                  size: 32,
                  font: 'Arial',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                }),
              ],
            }),
            paragraph(
              'Project created',
              `${moment(projectWithNotes.createdAt).format(
                'MMM D, YYYY - HH:mm',
              )}`,
            ),
            paragraph(
              'Team',
              `${projectWithNotes.projectMemberships
                .map((p) => p.user?.fullName)
                .filter((name) => name)
                .join(', ')}`,
            ),
            newLine,
            newLine,
            line,
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Templates',
                  size: 28,
                  font: 'Arial',
                  bold: true,
                }),
              ],
            }),
            ...Object.keys(projectWithNotes.templates).flatMap(
              (templateName) => {
                const template = projectWithNotes.templates[
                  templateName as keyof typeof projectWithNotes.templates
                ] as {
                  metadataFields: {
                    name: string
                    variant: string
                  }[]
                  noteFields: {
                    name: string
                  }[]
                }

                return [
                  newLine,
                  paragraph(
                    templateName,
                    [
                      ...template.metadataFields.map(
                        (field) =>
                          `${field.name} (${mapMetadataFieldNames(
                            field.variant as MetadataFieldVariant,
                          )
                            .toLocaleLowerCase()
                            .replace('_', ' ')})`,
                      ),
                      ...template.noteFields.map(
                        (field) => `${field.name} (text)`,
                      ),
                    ].join('\n'),
                  ),
                ]
              },
            ),
            newLine,
            newLine,
            line,
            newLine,
            ...projectWithNotes.notes.flatMap((note) => {
              const title = new Paragraph({
                children: [
                  new TextRun({
                    text: `Note: ${note.title}`,
                    size: 28,
                    font: 'Arial',
                    bold: true,
                  }),
                ],
              })

              const template = paragraph(
                'Template',
                `${note.templateName} (version ${note.templateVersion})`,
              )

              const noteCreated = paragraph(
                'Note created',
                `${moment(note.createdAt).format('MMM D, YYYY - HH:mm')}`,
              )
              const authoredBy = paragraph(
                'Authored by',
                `${note.author?.fullName} - ${note.author?.email}`,
              )

              const hashtags = paragraph(
                'Hashtags',
                [...new Set(note.noteFields.flatMap((n) => n.hashtags))].join(
                  ', ',
                ),
              )

              const mentions = paragraph(
                'Mentions',
                [...new Set(note.noteFields.flatMap((n) => n.mentions))].join(
                  ', ',
                ),
              )

              const metadata = note.metadataFields.map((field) => {
                return paragraph(field.name, field.value || '')
              })

              const noteFields = note.noteFields.flatMap((field) => {
                return [
                  paragraph(field.name, field.content?.toString() || ''),
                  newLine,
                ]
              })

              return [
                title,
                newLine,
                template,
                noteCreated,
                authoredBy,
                newLine,
                hashtags,
                mentions,
                newLine,
                ...metadata,
                newLine,
                ...noteFields,
                line,
                newLine,
                newLine,
              ]
            }),
          ],
        },
      ],
    })

    const buffer = (await Packer.toBuffer(doc)) as Buffer
    const base64 = buffer.toString('base64')

    return base64
  })
