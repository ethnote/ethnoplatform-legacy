import { FC, useEffect } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Box } from '@chakra-ui/react'
import { PublicPage } from 'types/publicPage'

import { Layout } from 'layouts'
import { getAllPublicPages } from 'utils/getPublicPages'
import { Footer, Hero, LandingPageMenu, RequestAccess, USPs } from 'components'

const Home: FC<NextPage & { publicPages: PublicPage[] }> = ({
  publicPages,
}) => {
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/quick-notes')
  }, [router])

  return (
    <Layout pageTitle='Ethnote'>
      <Box position='relative'>
        <LandingPageMenu publicPages={publicPages} />
        {/* <Hero />
        <USPs /> */}
        <RequestAccess />
        {/* <Footer publicPages={publicPages} /> */}
      </Box>
    </Layout>
  )
}

export default Home

export async function getStaticProps() {
  const publicPages = getAllPublicPages([
    'slug',
    'title',
    'footerCategory',
    'menuTitle',
  ]) as Omit<PublicPage, 'content'>[]

  return {
    props: {
      publicPages,
    },
  }
}
