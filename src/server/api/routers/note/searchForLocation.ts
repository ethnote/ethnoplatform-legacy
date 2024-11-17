import { env } from 'env.mjs'
import { GeocodingResults } from 'types/GeocodingResults'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const searchForLocation = protectedProcedure
  .input(
    z.object({
      searchWord: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { searchWord } = input

    if (!searchWord) return []

    const formattedSearchWord = encodeURIComponent(
      searchWord.replace(/ /g, '+'),
    )

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedSearchWord}&key=${env.GOOGLE_GEOCODING_API_KEY}`
    const res = (await fetch(url).then((res) => res.json())) as GeocodingResults

    return res.results
  })
