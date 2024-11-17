import { FC } from 'react'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  CloseButton,
  useDisclosure,
} from '@chakra-ui/react'

type Props = {
  initialVisible: boolean
  title: string
  text: string
}

const TempInfoCard: FC<Props> = (p) => {
  const { isOpen: isVisible, onClose } = useDisclosure({
    defaultIsOpen: p.initialVisible,
  })

  return isVisible ? (
    <Alert status='success' variant='left-accent' my={4}>
      <AlertIcon />
      <Box>
        <AlertTitle>{p.title}</AlertTitle>
        <AlertDescription>{p.text}</AlertDescription>
      </Box>
      <CloseButton
        alignSelf='flex-start'
        position='relative'
        right={-1}
        top={-1}
        onClick={onClose}
      />
    </Alert>
  ) : (
    <></>
  )
}

export default TempInfoCard
