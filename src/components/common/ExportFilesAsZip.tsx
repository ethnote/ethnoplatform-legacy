import { FC, useState } from 'react'
import { Button, IconButton, Tooltip } from '@chakra-ui/react'
import Axios from 'axios'
import saveAs from 'file-saver'
import JSZip from 'jszip'
import moment from 'moment'
import { BsFileEarmarkZip } from 'react-icons/bs'

type FileType = {
  name: string
  signedUrl: string
  projectName?: string
  noteName?: string
  createdAt?: Date
}

type Props = {
  files?: FileType[]
  projectName?: string
  textOverride?: string
  mb?: number
  useSimpleButton?: boolean
}

export const cleanFilenameString = (str: string) => {
  return str.replace(/[^a-zA-Z0-9.]/g, '_').toLocaleLowerCase()
}

export const exportAllAsZip = async (
  files: FileType[],
  projectName: string,
) => {
  if (!files.length) return

  try {
    const folderName = projectName + ' files' || 'Project files'

    const zip = new JSZip()
    const photosZip = zip.folder(folderName)

    let count = 1

    for (const file of files) {
      let filename = `${count}_${file.name}`

      if (file.createdAt) {
        filename = `${moment(file.createdAt).format('YYYY_MM_DD')}_${filename}`
      }

      if (file.noteName) {
        filename = `${file.noteName}_${filename}`
      }

      if (file.projectName) {
        filename = `${file.projectName}_${filename}`
      }

      count++

      const signedUrl = file.signedUrl + ''
      const url = '/' + signedUrl.substring(signedUrl.indexOf('files'))

      try {
        const r = await Axios.get<Blob>(url, {
          responseType: 'blob',
        })

        photosZip?.file(cleanFilenameString(filename), r.data)
      } catch (e) {
        console.error(e)
      }
    }

    const toSave = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    })

    saveAs(toSave, `${folderName}.zip`)
  } catch (e) {
    console.error(e)
  }
}

const ExportFilesAsZip: FC<Props> = (p) => {
  const [isExporting, setIsExporting] = useState(false)

  const onClick = async () => {
    if (!p.files || !p.projectName) return

    setIsExporting(true)
    await exportAllAsZip(p.files, p.projectName)
    setIsExporting(false)
  }

  const hasFiles = (p.files || []).length > 0

  if (p.useSimpleButton) {
    return (
      <Tooltip
        label='Export all attachments as ZIP'
        aria-label='Export all attachments as ZIP'
      >
        <IconButton
          icon={<BsFileEarmarkZip />}
          onClick={onClick}
          isDisabled={!hasFiles}
          variant='outline'
          aria-label={''}
        >
          ZIP
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      mb={p.mb ?? 4}
      opacity={hasFiles ? 1 : 0.5}
      size='md'
      fontWeight='normal'
      variant='outline'
      rightIcon={<BsFileEarmarkZip />}
      isLoading={isExporting}
      onClick={onClick}
    >
      {p.textOverride ?? 'Download as ZIP'}
    </Button>
  )
}

export default ExportFilesAsZip
