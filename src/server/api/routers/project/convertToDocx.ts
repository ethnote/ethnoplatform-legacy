import { Document, Packer, Paragraph, TextRun } from 'docx'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const convertToDocx = protectedProcedure
  .input(
    z.object({
      paragraphs: z.array(z.string()),
    }),
  )
  .mutation(async ({ input }) => {
    const { paragraphs } = input

    const paragraph = (content: string) => {
      return new Paragraph({
        children: [
          ...content.split('\n').map(
            (line) =>
              new TextRun({
                text: `${line}`,
                font: 'Arial',
              }),
          ),
        ].filter(Boolean) as TextRun[],
      })
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                }),
              ],
            }),
            ...paragraphs.map((p) => paragraph(p)),
          ],
        },
      ],
    })

    const buffer = (await Packer.toBuffer(doc)) as Buffer
    const base64 = buffer.toString('base64')

    return base64
  })
