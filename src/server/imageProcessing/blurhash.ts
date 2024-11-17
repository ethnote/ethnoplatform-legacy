import axios from 'axios'
import { encode } from 'blurhash'
import sharp from 'sharp'

export const encodeImageToBlurhash = (url: string) =>
  new Promise(async (resolve, reject) => {
    const buffer = (await axios({ url, responseType: 'arraybuffer' }))
      .data as Buffer

    sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .withMetadata() // add this line here
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err)
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4))
      })
  })
