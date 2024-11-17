import { FC, useCallback, useState } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import Axios from 'axios'
import saveAs from 'file-saver'
import JSZip from 'jszip'
import moment from 'moment'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { EasyForm, Modal } from 'components'
import { cleanFilenameString } from 'components/common/ExportFilesAsZip'

type Props = {
  isOpen: boolean
  onClose: () => void
  isExporting: boolean
  setIsExporting: (isExporting: boolean) => void
  selectedNotes: string[]
  projectName?: string
  projectId?: string
  notes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

type ExportOptions = {
  filename: string
  exportStructure: 'single-file' | 'folders'
  include: ('attachments' | 'instructions')[]
  fileFormat: TextExportType
}

type TextExportType = 'docx' | 'xlsx' | 'csv' | 'json' | 'txt'
const textExportTypeArray = ['docx', 'xlsx', 'csv', 'json', 'txt'] as const

const ExportModal: FC<Props> = (p) => {
  const [exportStructure, setExportStructure] = useState<
    'single-file' | 'folders'
  >('single-file')
  const toast = useToast()

  const exportFilename =
    `${p.projectName?.toLocaleLowerCase()}_notes_${moment().format(
      'DD_MM_YYYY',
    )}`.replace(/ /g, '_')

  const noteExportErrorToast = useCallback(
    (description: string) =>
      toast({
        title: 'An error occurred while exporting the notes',
        description,
        status: 'error',
        duration: 6000,
        isClosable: true,
      }),
    [toast],
  )

  const exportNotesAsJSON = api.project.exportNotesAsJSON.useMutation()
  const exportNotesAsCSV = api.project.exportNotesAsCSV.useMutation()
  const exportNotesAsXLSX = api.project.exportNotesAsXLSX.useMutation()
  const exportNotesAsTXT = api.project.exportNotesAsTXT.useMutation()
  const exportNotesAsDOCX = api.project.exportNotesAsDOCX.useMutation()

  const downloadLink = ({
    filename,
    href,
  }: {
    filename: string
    href: string
  }) => {
    const link = document.createElement('a')
    link.href = href
    link.download = filename

    link.click()
  }

  const exportAsFolderStructure = async (
    type: TextExportType,
    folderName: string,
    withFiles = true,
    includeInfoText = false,
  ) => {
    if (p.selectedNotes.length === 0 || !p.projectId) return

    p.setIsExporting(true)

    const notesToExport = p.selectedNotes
      .map((note) => p.notes?.find((n) => n.id === note))
      .filter(Boolean) as NonNullable<typeof p.notes>

    const content = (
      await Promise.all(
        notesToExport.map(async (note) => {
          const mutator = getMutator(type)
          const linkWrapper = getLinkWrapper(type)

          try {
            const toBeExported = await mutator.mutateAsync({
              projectId: p.projectId as string,
              noteIds: [note.id],
              includeInfoText: includeInfoText,
            })

            return {
              filename: `${note.handle}/${note.handle}.${type}`,
              href: linkWrapper(toBeExported),
              files: note.files?.map((file, i) => ({
                filename: `${note.handle}/${cleanFilenameString(
                  `${i}_${file.name}`,
                )}`,
                href:
                  '/' +
                  file.signedUrl.substring(file.signedUrl.indexOf('files')), // Because of CORS - proxy (see next.config.mjs)
              })),
            }
          } catch (e: any) {
            noteExportErrorToast(e.message)
          }
        }),
      )
    ).filter(Boolean) as {
      filename: string
      href: string
      files: { filename: string; href: string }[]
    }[]

    try {
      const zip = new JSZip()
      const zipFolder = zip.folder(folderName)

      for (const item of content) {
        try {
          const r = await Axios.get<Blob>(item.href, {
            responseType: 'blob',
          })

          zipFolder?.file(item.filename, r.data)
        } catch (e) {
          console.error(e)
        }

        if (withFiles) {
          for (const file of item.files) {
            try {
              const r = await Axios.get<Blob>(file.href, {
                responseType: 'blob',
              })

              zipFolder?.file(file.filename, r.data)
            } catch (e) {
              console.error(e)
            }
          }
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
    } finally {
      p.setIsExporting(false)
    }
  }

  // const exportOnlyFiles = async () => {
  //   p.setIsExporting(true)
  //   await exportAllAsZip(
  //     filesFromSelected || [],
  //     p.projectName?|| project?.handle || 'project',
  //   )
  //   p.setIsExporting(false)
  // }

  const getMutator = (type: TextExportType) =>
    ({
      json: exportNotesAsJSON,
      csv: exportNotesAsCSV,
      xlsx: exportNotesAsXLSX,
      txt: exportNotesAsTXT,
      docx: exportNotesAsDOCX,
    })[type]

  const getLinkWrapper = (type: TextExportType) => (notes: string) =>
    ({
      json: `data:text/json;chatset=utf-8,${encodeURIComponent(
        JSON.stringify(notes, null, 2),
      )}`,
      csv: `data:text/csv;chatset=utf-8,${encodeURIComponent(notes)}`,
      xlsx: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${notes}`,
      txt: `data:text/plain;chatset=utf-8,${encodeURIComponent(notes)}`,
      docx: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${notes}`,
    })[type]

  const onExportNoteClicked = async (
    type: TextExportType,
    filename: string,
    includeInfoText: boolean,
  ) => {
    if (!p.projectId) return

    const mutator = getMutator(type)
    const linkWrapper = getLinkWrapper(type)

    try {
      const toBeExported = await mutator.mutateAsync({
        projectId: p.projectId,
        noteIds: p.selectedNotes,
        includeInfoText: includeInfoText,
      })

      downloadLink({
        filename: `${filename}.${type}`,
        href: linkWrapper(toBeExported),
      })
    } catch (e: any) {
      noteExportErrorToast(e.message)
    }
  }

  const onSubmit = async (values: Partial<ExportOptions>, cb: () => void) => {
    if (!p.projectId) return
    const type = values.fileFormat
    const includeFiles = !!values.include?.includes('attachments')
    const includeInfoText = !!values.include?.includes('instructions')

    if (!type) {
      toast({
        title: 'No file format selected',
        description: 'Please select at least one file format',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      cb()
      return
    }

    p.setIsExporting(true)

    if (values.exportStructure === 'single-file') {
      await onExportNoteClicked(
        type,
        values.filename || exportFilename,
        includeInfoText,
      )
      p.setIsExporting(false)
    } else {
      await exportAsFolderStructure(
        type,
        values.filename || exportFilename,
        includeFiles,
        includeInfoText,
      )

      p.setIsExporting(false)
    }

    p.onClose()
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Download Notes'
      size='xl'
    >
      <Box mb={4}>
        <EasyForm<ExportOptions>
          loading={false}
          initialValues={{
            exportStructure: 'single-file',
            include: [],
            fileFormat: 'txt',
          }}
          config={{
            filename: {
              kind: 'input',
              label: 'Filename',
              placeholder: exportFilename,
              optional: true,
            },
            exportStructure: {
              kind: 'radio',
              label: 'Structure',
              options: ['single-file', 'folders'],
              optionLabels: ['Single file', 'As folders'],
              optional: true,
            },
            include:
              exportStructure === 'single-file'
                ? {
                    kind: 'checkbox_multi',
                    label: 'Include',
                    options: ['instructions'],
                    optionLabels: ['Note instructions'],
                  }
                : {
                    kind: 'checkbox_multi',
                    label: 'Include',
                    options: ['instructions', 'attachments'],
                    optionLabels: ['Note instructions', 'Attachments'],
                    direction: 'row',
                  },
            fileFormat: {
              kind: 'radio',
              label: 'File Format',
              options: [...textExportTypeArray],
              optionLabels: [...textExportTypeArray].map(
                (type) =>
                  `.${type} ${
                    {
                      json: '(JavaScript object notation)',
                      csv: '(Comma separated values)',
                      txt: '(Raw text)',
                      docx: '(Word)',
                      xlsx: '(Excel)',
                    }[type as string] || ''
                  }`,
              ),
            },
          }}
          submitButtonText={'Download'}
          onChange={(values) => {
            setExportStructure(values.exportStructure || 'single-file')
          }}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default ExportModal
