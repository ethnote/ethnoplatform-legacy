import { FC, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  IconButton,
  Progress,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react'
import { padStart } from 'lodash'
import moment from 'moment'
import { useAudioRecorder } from 'react-audio-voice-recorder'
import { AiOutlinePause, AiOutlineSave } from 'react-icons/ai'
import { BsFillRecordFill, BsTrash } from 'react-icons/bs'

import { api } from 'utils/api'
import { uploadFile } from 'utils/uploadFile'
import { useLeavePageConfirm } from 'hooks/useLeavePageConfirm'

type Props = {
  noteId?: string
}

export const formatRecordingTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time - minutes * 60)
  return `${padStart(minutes.toString(), 2, '0')}:${padStart(
    seconds.toString(),
    2,
    '0',
  )}`
}

const AudioRecorder: FC<Props> = (p) => {
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
  } = useAudioRecorder()
  const [didPressSave, setDidPressSave] = useState(false)
  const [durationToSave, setDurationToSave] = useState<number>(0)
  const [progress, setProgress] = useState<number>()
  const [error, setError] = useState('')
  const utils = api.useContext()
  const toast = useToast()
  const [wasStoppedByTimeLimit, setWasStoppedByTimeLimit] = useState(false)

  useEffect(() => {
    if (recordingTime === 60 * 10) {
      saveRecording()
      setWasStoppedByTimeLimit(true)
    }
  }, [recordingTime])

  const getSignedUrl = api.note.uploadFile.useMutation({
    onError(err) {
      setError(err.message)
    },
  })

  useLeavePageConfirm(
    isRecording,
    'You are still recording. Are you sure you want to leave?',
  )

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (isRecording) {
      window.addEventListener('beforeunload', handler)
      return () => {
        window.removeEventListener('beforeunload', handler)
      }
    }
    return () => {}
  }, [isRecording])

  useEffect(() => {
    if (!error) return
    toast({
      title: 'An error occurred while saving the recording',
      description: error,
      status: 'error',
      duration: 6000,
      isClosable: true,
    })
  }, [error])

  const upload = async (blob: Blob) => {
    if (!p.noteId) return

    const mimeType = blob.type.split(';')[0] as string

    const postFix = {
      'audio/wav': '.wav',
      'audio/mp3': '.mp3',
      'audio/ogg': '.ogg',
      'audio/webm': '.webm',
      'audio/mp4': '.mp4',
      'audio/aac': '.aac',
      'audio/mpeg': '.mpeg',
      'audio/x-m4a': '.m4a',
      'audio/x-matroska': '.mka',
    }[mimeType]

    const filename = 'rec_' + moment().format('YYYY_MM_DD_HH_mm') + postFix

    getSignedUrl.mutateAsync(
      {
        noteId: p.noteId,
        filename,
        mimeType,
        size: blob.size,
        duration: durationToSave,
      },
      {
        onSettled: async (res) => {
          if (!recordingBlob || !res?.signedUrl) return

          const file = new File([recordingBlob], res?.file.name || '', {
            type: res?.file.mimeType,
          })

          try {
            await uploadFile(res?.signedUrl, file, (_, percent) => {
              setProgress(percent)
            })
            toast({
              title: `Successfully uploaded recording`,
              status: 'success',
              duration: 6000,
              isClosable: true,
            })
          } catch (e) {
            setError(e as string)
          }

          utils.note.note.invalidate()

          if (wasStoppedByTimeLimit) {
            startRecording()
            setWasStoppedByTimeLimit(false)
          }
        },
      },
    )
  }

  useEffect(() => {
    if (!recordingBlob || !didPressSave) return
    upload(recordingBlob)
    setDidPressSave(false)
  }, [recordingBlob])

  const discardRecording = () => {
    stopRecording()
  }

  const saveRecording = () => {
    setDurationToSave(recordingTime)
    setDidPressSave(true)
    stopRecording()
  }

  const recorder = useMemo(() => {
    return (
      <>
        <ButtonGroup variant='outline'>
          {!isRecording ? (
            <Button leftIcon={<BsFillRecordFill />} onClick={startRecording}>
              Start audio recording
            </Button>
          ) : (
            <>
              {isPaused ? (
                <IconButton
                  icon={<BsFillRecordFill />}
                  onClick={togglePauseResume}
                  aria-label={'Resume Recording'}
                />
              ) : (
                <IconButton
                  icon={<AiOutlinePause />}
                  onClick={togglePauseResume}
                  aria-label={'Pause Recording'}
                />
              )}
              <Button
                colorScheme='green'
                leftIcon={<AiOutlineSave />}
                onClick={saveRecording}
              >
                Save recording
              </Button>
              <IconButton
                icon={<BsTrash />}
                onClick={discardRecording}
                aria-label={'Discard Recording'}
              />
            </>
          )}
        </ButtonGroup>
      </>
    )
  }, [
    isRecording,
    isPaused,
    startRecording,
    stopRecording,
    togglePauseResume,
    error,
    discardRecording,
  ])

  const Uploader = () => {
    return (
      <Box my={4}>
        <Center mb={6}>
          {finishedUploading ? (
            <Center>
              <Text>Finished uploading</Text>
              <Spinner ml={4} />
            </Center>
          ) : (
            <Text>Uploading recording... ({Math.round(progress || 0)}%)</Text>
          )}
        </Center>
        <Progress
          hasStripe
          borderRadius='full'
          value={progress}
          colorScheme={finishedUploading ? 'green' : 'blue'}
        />
      </Box>
    )
  }

  const finishedUploading = progress && Math.round(progress) === 100
  const showUploader =
    (progress !== undefined || didPressSave) && !finishedUploading

  return (
    <Flex alignItems='center'>
      {isRecording ? (
        <Box mr={4}>
          <Text>{formatRecordingTime(recordingTime)}</Text>
        </Box>
      ) : (
        <></>
      )}
      {showUploader ? <Uploader /> : recorder}
    </Flex>
  )
}

export default AudioRecorder
