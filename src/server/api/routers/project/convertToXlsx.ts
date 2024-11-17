import XLSX from 'xlsx'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const convertToXlsx = protectedProcedure
  .input(
    z.object({
      grid: z.array(z.array(z.string())),
    }),
  )
  .mutation(async ({ input }) => {
    const grid = input.grid

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(grid as any[])

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

    const base64 = XLSX.write(wb, {
      type: 'base64',
    })

    return base64
  })
