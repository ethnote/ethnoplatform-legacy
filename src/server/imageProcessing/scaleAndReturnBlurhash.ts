import axios from 'axios'
import { encode } from 'blurhash'
import { env } from 'env.mjs'
import { uploadFile } from 'server/storage'
import sharp from 'sharp'

const IMAGE_WIDTH = 300

export const scaleAndReturnBlurhash = (
  url: string,
  dest: string,
): Promise<string> =>
  new Promise(async (resolve, reject) => {
    const buffer = (await axios({ url, responseType: 'arraybuffer' }))
      .data as Buffer

    sharp(buffer)
      .rotate()
      .resize(IMAGE_WIDTH)
      .toBuffer(async (err, buffer) => {
        if (err) return reject(err)
        await uploadFile(env.SERVER_AWS_S3_BUCKET_NAME, dest, buffer)

        sharp(buffer)
          .rotate()
          .raw()
          .ensureAlpha()
          .resize(32, 32, { fit: 'inside' })
          .toBuffer((err, buffer, { width, height }) => {
            if (err) return reject(err)
            resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4))
          })
      })
  })
