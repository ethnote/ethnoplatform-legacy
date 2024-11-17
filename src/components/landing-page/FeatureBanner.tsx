import { FC } from 'react'
import { Box, Text } from '@chakra-ui/react'

type Props = {
  param?: string
}

const FeatureBanner: FC<Props> = () => {
  return (
    <Box>
      <Text>FeatureBanner</Text>
    </Box>
  )
}

export default FeatureBanner
