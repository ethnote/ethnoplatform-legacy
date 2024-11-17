import { PassThrough } from 'stream'
import axios from 'axios'
import { env } from 'env.mjs'
import { uploadFile } from 'server/storage'
import sharp from 'sharp'

const IMAGE_WIDTH = 300

export const scaleImageFromUrl = async (
  url: string,
  dest: string,
): Promise<void> => {
  const uploadStream = () => {
    const passThrough = new PassThrough()
    uploadFile(env.SERVER_AWS_S3_BUCKET_NAME, dest, passThrough)
    return passThrough
  }

  return new Promise((resolve, reject) => {
    const transformer = sharp({ failOnError: false })
      .resize(IMAGE_WIDTH)
      .on('info', function (info) {
        console.log('Image height is ' + info.height)
      })

    axios({
      method: 'get',
      url,
      responseType: 'stream',
    })
      .then((res) => {
        res.data.pipe(transformer).pipe(uploadStream())
        resolve()
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      })
  })
}
