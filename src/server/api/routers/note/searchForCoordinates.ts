import { env } from 'env.mjs'
import { GeocodingResults } from 'types/GeocodingResults'
import { z } from 'zod'

import { protectedProcedure } from '../../trpc'

export const searchForCoordinates = protectedProcedure
  .input(
    z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { latitude, longitude } = input

    if (!latitude || !longitude) return []

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${env.GOOGLE_GEOCODING_API_KEY}`
    const res = (await fetch(url).then((res) => res.json())) as GeocodingResults

    return res.results
  })
