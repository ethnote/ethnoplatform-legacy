import { FC } from 'react'
import { Box, Container, Skeleton, Stack } from '@chakra-ui/react'

import { ContentBox } from 'components'

type Props = {
  withHeader?: boolean
  w?: string
}

const SkeletonPlaceholder: FC<Props> = (p) => {
  if (p.withHeader) {
    return (
      <Container maxWidth={p.w ?? '1140px'} pb={10} pt={20}>
        <Skeleton height='30px' w={'30%'} mb={8} mt={-3} />
        {/* <Skeleton height='22px' w={48} mb={4} /> */}
        <ContentBox>
          <Stack>
            <Skeleton height='34px' bg='red' />
            <Skeleton height='54px' />
          </Stack>
        </ContentBox>
      </Container>
    )
  }

  return (
    <Box>
      <ContentBox>
        <Stack>
          <Skeleton height='64px' />
          <Skeleton height='24px' />
        </Stack>
      </ContentBox>
    </Box>
  )
}

export default SkeletonPlaceholder
