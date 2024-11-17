import { FC } from 'react'
import { Box, Flex, Heading, useColorMode } from '@chakra-ui/react'

import LogoBlack from 'components/svg/LogoBlack'
import LogoWhite from 'components/svg/LogoWhite'

type Props = {
  hideText?: boolean
}

const Logo: FC<Props> = (p) => {
  const { colorMode } = useColorMode()

  return (
    <Flex alignItems='center'>
      <Box w={5} mr={2}>
        {colorMode === 'dark' ? <LogoWhite /> : <LogoBlack />}
      </Box>
      <Flex gap={1}>
        {!p.hideText && <Heading fontSize={22}>Ethnote (BETA)</Heading>}
        <Heading fontWeight='normal' fontSize={22} opacity={0.9}></Heading>
      </Flex>
    </Flex>
  )
}

export default Logo
