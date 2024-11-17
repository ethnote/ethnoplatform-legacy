import { ReactNode } from 'react'
import { Box, Container, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { BIG_CONTAINER_WIDTH } from 'constants/constants'
import moment from 'moment'
import { PublicPage } from 'types/publicPage'

import { Logo } from 'components'

const ListHeader = ({ children }: { children: ReactNode }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  )
}

export default function Footer(p: {
  publicPages: Omit<PublicPage, 'content'>[]
}) {
  const categories = p.publicPages.reduce(
    (acc, curr) => {
      if (!curr.footerCategory) return acc

      if (!acc[curr.footerCategory]) {
        acc[curr.footerCategory] = []
      }

      acc[curr.footerCategory]?.push(curr)
      return acc
    },
    {} as Record<string, Omit<PublicPage, 'content'>[]>,
  )

  return (
    <Box>
      <Container as={Stack} maxWidth={BIG_CONTAINER_WIDTH} py={10} pb={32}>
        <Flex
          justifyContent='space-between'
          flexDir={{
            base: 'column',
            md: 'row',
          }}
        >
          <Stack spacing={6}>
            <Box>
              <Logo />
            </Box>
            <Text fontSize={'sm'}>
              © {moment().format('YYYY')} Ethnote. All rights reserved
            </Text>
          </Stack>
          <SimpleGrid
            templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
            spacing={8}
          >
            {Object.keys(categories).map((category) => (
              <Stack align={'flex-start'} key={category}>
                <ListHeader>{category}</ListHeader>
                {categories[category]?.map((page) => (
                  <Box as='a' key={page.slug} href={`/${page.slug}`}>
                    {page.title}
                  </Box>
                ))}
              </Stack>
            ))}
          </SimpleGrid>
        </Flex>
      </Container>
    </Box>
  )
}
