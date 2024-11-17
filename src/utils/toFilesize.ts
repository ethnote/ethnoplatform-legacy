import { filesize } from 'filesize'

export const toFileSize = (value: any) =>
  filesize(typeof value === 'number' ? value : 0, {
    base: 2,
    standard: 'jedec',
  }).toString()
