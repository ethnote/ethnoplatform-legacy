import { FC, useCallback, useRef, useState } from 'react'
import { Box, Button, ButtonGroup, Center, Image } from '@chakra-ui/react'
import Axios from 'axios'
import { BORDER_RADIUS } from 'constants/constants'
import { isDesktop } from 'react-device-detect'
import { AiOutlineCheckCircle, AiOutlineRedo } from 'react-icons/ai'
import { BiWebcam } from 'react-icons/bi'
import ReactWebcam from 'react-webcam'

import Modal from 'components/common/Modal'

type Props = {
  setFileToUpload: (file: File) => void
}

const Webcam: FC<Props> = (p) => {
  const webcamRef = useRef<ReactWebcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot({
      width: 1280,
      height: 960,
    })
    setImgSrc(imageSrc)
  }, [webcamRef])

  const reset = () => {
    setImgSrc(null)
  }

  const onClose = () => {
    setIsModalOpen(false)
    setImgSrc(null)
  }

  const uplaodImage = async () => {
    if (!imgSrc) return

    const blob = await Axios.get<Blob>(imgSrc, {
      responseType: 'blob',
    })

    const file = new File([blob.data], 'image.png', { type: 'image/png' })
    p.setFileToUpload(file)
    onClose()
  }

  if (!isDesktop) {
    return null
  }

  return (
    <Box mt={4}>
      <Center>
        <Button
          variant='outline'
          leftIcon={<BiWebcam />}
          onClick={() => setIsModalOpen(true)}
        >
          Capture photo with webcam
        </Button>
      </Center>
      <Modal isOpen={isModalOpen} onClose={onClose}>
        <>
          {isModalOpen && (
            <Box borderRadius={BORDER_RADIUS}>
              <Box h={imgSrc ? 0 : undefined} w={imgSrc ? 0 : undefined}>
                <ReactWebcam
                  screenshotFormat='image/png'
                  ref={webcamRef}
                  width={1280}
                  height={960}
                />
              </Box>
              {imgSrc && <Image alt='' src={imgSrc} />}
            </Box>
          )}
          <Center>
            <ButtonGroup variant='outline' my={4}>
              {!imgSrc && (
                <Button leftIcon={<BiWebcam />} onClick={capture}>
                  Capture photo
                </Button>
              )}
              {imgSrc && (
                <Button
                  colorScheme='green'
                  leftIcon={<AiOutlineCheckCircle />}
                  onClick={uplaodImage}
                >
                  Use photo
                </Button>
              )}
              {imgSrc && (
                <Button leftIcon={<AiOutlineRedo />} onClick={reset}>
                  Retake
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </ButtonGroup>
          </Center>
        </>
      </Modal>
    </Box>
  )
}

export default Webcam
