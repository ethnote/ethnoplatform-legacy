/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export const uploadFile = async (
  presignedUrl: string,
  file: File,
  setPercentCompleted: (name: string, percent: number) => void,
  controller?: AbortController,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .put(presignedUrl, file, {
        signal: controller?.signal,
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent: any) => {
          setPercentCompleted(
            file.name,
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          )
        },
      })
      .then((result) => {
        resolve(result)
        return result
      })
      .catch((error) => {
        console.error('ERROR: ' + JSON.stringify(error))
        reject(JSON.stringify(error))
      })
  })
}
