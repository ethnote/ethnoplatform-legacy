import { z } from 'zod'

export const templateZod = z
  .object({
    metadataFields: z.array(z.any()),
    noteFields: z.array(z.any()),
  })
  .optional()
