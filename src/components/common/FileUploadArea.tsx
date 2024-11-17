import { FC, useCallback, useState } from 'react'
import {
  Box,
  Button,
  Center,
  Flex,
  Progress,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import { filesize } from 'filesize'
import { isMobile } from 'react-device-detect'
import Dropzone from 'react-dropzone'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import { TbDragDrop } from 'react-icons/tb'

import { useStyle } from 'hooks/useStyle'

type Props = {
  supportedFilesText?: string
  maxFileSize?: number
  uploadFiles: (files: File[]) => void
  isUploading: boolean
  progress?: number
  error?: string
  setError?: (error: string) => void
  supporedMimeTypes?: string[]
  onAbort?: () => void
}

const FileUploadArea: FC<Props> = (p) => {
  const { interactiveColor, borderColor, hoverBg } = useStyle()
  const [isDraggedOver, setIsDraggedOver] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    setIsDraggedOver(false)
    p.setError?.('')

    if (!files.length) {
      p.setError?.('No file found')
      return
    }

    if (files.some((f) => p.maxFileSize && f.size > p.maxFileSize)) {
      p.setError?.('File is too large')
      return
    }

    if (
      files.some(
        (f) =>
          p.supporedMimeTypes?.length && !p.supporedMimeTypes.includes(f.type),
      )
    ) {
      p.setError?.('File type is not supported')
      return
    }
    p.uploadFiles(files)
  }, [])

  const DropArea = () => {
    return (
      <Dropzone
        onDrop={onDrop}
        onDragOver={() => setIsDraggedOver(true)}
        onDragLeave={() => setIsDraggedOver(false)}
      >
        {({ getRootProps, getInputProps }) => (
          <Flex
            border='1px dashed'
            borderColor={borderColor}
            borderRadius={BORDER_RADIUS}
            p={8}
            flexDir='column'
            alignItems='center'
            justifyContent='center'
            bg={isDraggedOver ? hoverBg : 'transparent'}
            _hover={{
              cursor: 'pointer',
              bg: hoverBg,
            }}
            transition='0.2s'
            height={48}
            {...getRootProps()}
          >
            <input
              {...getInputProps()}
              accept={p.supporedMimeTypes?.join(', ')}
            />
            {!isDraggedOver ? (
              <AiOutlineCloudUpload size={24} />
            ) : (
              <TbDragDrop size={24} />
            )}
            {!isDraggedOver && (
              <Text mt={2} fontWeight='bold' color={interactiveColor}>
                Click to upload {isMobile ? 'or take picture' : ''}
              </Text>
            )}
            {isDraggedOver ? (
              <Text>Drop to upload file</Text>
            ) : !isMobile ? (
              <Text>or drag and drop</Text>
            ) : null}
            <Text fontSize='sm' color='gray.500' textAlign='center'>
              {p.supportedFilesText}
            </Text>
            <Text fontSize='sm' color='gray.500'>
              Max file size:{' '}
              {filesize(p.maxFileSize || 0, {
                base: 2,
                standard: 'jedec',
              }).toString()}
            </Text>
          </Flex>
        )}
      </Dropzone>
    )
  }

  const finishedUploading = Math.round(p.progress || 0) === 100
  if (p.progress !== undefined || p.isUploading) {
    return (
      <Box
        border='2px dashed'
        borderColor={borderColor}
        borderRadius={BORDER_RADIUS}
        p={8}
        flexDir='column'
        alignItems='center'
        justifyContent='center'
        transition='0.2s'
      >
        <Center mb={6}>
          <Flex>
            <Text>Uploading file... ({Math.round(p.progress || 0)}%)</Text>
            {finishedUploading && <Spinner ml={2} />}
          </Flex>
        </Center>
        <Progress
          hasStripe
          borderRadius='full'
          value={p.progress}
          colorScheme={finishedUploading ? 'green' : 'blue'}
        />
        {p.onAbort && (
          <Center mt={6}>
            <Button onClick={p.onAbort}>Cancel</Button>
          </Center>
        )}
      </Box>
    )
  }

  return (
    <>
      {p.error && (
        <Center p={4}>
          <Text color='red.500'>{p.error}</Text>
        </Center>
      )}
      <DropArea />
    </>
  )
}

export default FileUploadArea
