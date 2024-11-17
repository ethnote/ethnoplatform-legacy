import { FC } from 'react'
import { Box, Divider, DividerProps, Flex, Text } from '@chakra-ui/react'

type Props = {
  text?: string
}

const DividerWithText: FC<Props & DividerProps> = ({ text, ...p }) => {
  return (
    <Flex alignItems='center'>
      <Divider {...p} />
      <Box {...p}>
        <Text mx={2} color='gray.500' fontSize='sm' whiteSpace='nowrap'>
          {text}
        </Text>
      </Box>
      <Divider {...p} />
    </Flex>
  )
}

export default DividerWithText
