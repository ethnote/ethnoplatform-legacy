import { PassThrough } from 'stream'
import { S3 } from 'aws-sdk'
import { env } from 'env.mjs'
import NodeCache from 'node-cache'

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 })

const s3 = new S3({
  signatureVersion: 's3v4',
  accessKeyId: env.SERVER_AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: env.SERVER_AWS_S3_SECRET_ACCESS_KEY,
  region: env.SERVER_AWS_REGION,
})

export const getOrCreatedSignedUrl = (
  bucket: string,
  filname: string,
  objectType: 'putObject' | 'getObject',
): string => {
  const cache = myCache.get(bucket + filname + objectType) as string | undefined
  if (cache) {
    return cache
  } else {
    const val = createPresignedUrl(bucket, filname, objectType)
    myCache.set(bucket + filname + objectType, val, 60 * 60) // 1h expiry
    return val
  }
}

export const createPresignedUrl = (
  bucket: string,
  filname: string,
  objectType: 'putObject' | 'getObject',
): string =>
  s3.getSignedUrl(objectType, {
    Bucket: bucket,
    Key: filname,
    Expires: 60 * 60 * 24, // 24h expiry
  })

export const checkIfS3ObjectExistsAndSignUrl = async (
  bucket: string,
  key: string,
) => {
  try {
    await s3
      .headObject({
        Bucket: bucket,
        Key: key,
      })
      .promise()
    const signedUrl = await createPresignedUrl(bucket, key, 'getObject')
    return signedUrl
  } catch (error) {
    console.log(error)
    return null
  }
}

export const uploadFile = async (
  bucket: string,
  key: string,
  file: Buffer | PassThrough,
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: bucket,
        Key: key,
        Body: file,
      },
      function (err, data) {
        if (err) {
          reject(err)
          return
        }
        console.log(`File uploaded successfully. ${data.Location}`)
        resolve(data.Location)
      },
    )
  })
}

export const deleteFile = async (
  bucket: string,
  key: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    s3.deleteObject(
      {
        Bucket: bucket,
        Key: key,
      },
      (err) => {
        if (err) {
          reject(err)
          return
        }
        console.log(`File deleted successfully. ${key}`)
        resolve(key)
      },
    )
  })
}

export const copyFile = async (
  fromBucket: string,
  fromKey: string,
  toBucket: string,
  toKey: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    s3.copyObject(
      {
        Bucket: toBucket,
        Key: toKey,
        CopySource: `${fromBucket}/${fromKey}`,
      },
      (err) => {
        if (err) {
          reject(err)
          return
        }
        console.log(`File copied successfully. ${toKey}`)
        resolve(toKey)
      },
    )
  })
}
