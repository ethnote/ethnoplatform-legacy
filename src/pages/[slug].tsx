import { FC } from 'react'
import { NextPage } from 'next'
import { Container, Flex } from '@chakra-ui/react'
import { SMALL_CONTAINER_WIDTH } from 'constants/constants'
import { PublicPage } from 'types/publicPage'

import { Layout } from 'layouts'
import { getAllPublicPages, getPublicPageBySlug } from 'utils/getPublicPages'
import { Footer, LandingPageMenu, RenderMarkdown } from 'components'

type Props = {
  publicPage: PublicPage
  publicPages: PublicPage[]
}

const PublicPages: FC<NextPage & Props> = ({ publicPage, publicPages }) => {
  return (
    <Layout pageTitle={publicPage.title}>
      <LandingPageMenu publicPages={publicPages} />
      <Container maxWidth={SMALL_CONTAINER_WIDTH}>
        <Flex
          w='100%'
          flexDir='column'
          minH='calc(100vh - 64px)'
          pb={40}
          pt={5}
        >
          <RenderMarkdown>{publicPage.content}</RenderMarkdown>
        </Flex>
      </Container>
      <Footer publicPages={publicPages} />
    </Layout>
  )
}

export default PublicPages

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const publicPage = getPublicPageBySlug(params.slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
  ])

  const publicPages = getAllPublicPages([
    'slug',
    'title',
    'footerCategory',
    'menuTitle',
  ]) as Omit<PublicPage, 'content'>[]

  return {
    props: {
      publicPages,
      publicPage: {
        ...publicPage,
        content: publicPage.content,
      },
    },
  }
}

export async function getStaticPaths() {
  const publicPages = getAllPublicPages(['slug'])

  return {
    paths: publicPages.map((publicPage) => {
      return {
        params: {
          slug: publicPage.slug,
        },
      }
    }),
    fallback: false,
  }
}
