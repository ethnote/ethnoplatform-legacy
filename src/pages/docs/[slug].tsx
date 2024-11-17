import { FC, useCallback } from 'react'
import { NextPage } from 'next'
import Link from 'next/link'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Container,
  Flex,
  Text,
} from '@chakra-ui/react'
import { MEDIUM_CONTAINER_WIDTH } from 'constants/constants'
import { useSession } from 'next-auth/react'
import { Doc } from 'types/doc'
import { PublicPage } from 'types/publicPage'

import { AuthenticatedLayout, Layout } from 'layouts'
import { getAllDocs, getDocBySlug } from 'utils/getDocs'
import { getAllPublicPages } from 'utils/getPublicPages'
import { useGlobalState } from 'hooks/useGlobalState'
import { LandingPageMenu, RenderMarkdown } from 'components'
import { MENU_HEIGHT } from 'components/common/Menu'

type Props = {
  doc: Doc
  menuItems: {
    slug: string
    title: string
    category: string
  }[]
  publicPages: PublicPage[]
}

const Docs: FC<NextPage & Props> = ({ doc, menuItems, publicPages }) => {
  const { data: session } = useSession()
  const { isSmallScreen } = useGlobalState()

  const MENU_WIDTH = '250px'

  const categories = menuItems
    .filter((menuItem) => menuItem?.category)
    .map((menuItem) => menuItem.category)
    .filter((category, i, arr) => arr.indexOf(category) === i)

  const onThisPage = (markdown: string) => {
    const headers = markdown.match(/#{1,5} .+/g)
    return headers?.map((header) => {
      const level = header.match(/#/g)?.length
      const text = header.replace(/#{1,5} /g, '')
      return { level, text }
    })
  }

  const onThisPageItems =
    onThisPage(doc.content)?.filter((h) => h.level !== 1) || []

  const Wrapper = useCallback(
    ({ children }: { children: JSX.Element }) => {
      return (
        <Layout pageTitle='Docs'>
          <LandingPageMenu publicPages={publicPages} />
          {children}
        </Layout>
      )
      // if (session) {
      //   return (
      //     <AuthenticatedLayout pageTitle='Docs' session={session}>
      //       {children}
      //     </AuthenticatedLayout>
      //   )
      // } else {
      //   return (
      //     <Layout pageTitle='Docs'>
      //       <LandingPageMenu publicPages={publicPages} />
      //       {children}
      //     </Layout>
      //   )
      // }
    },
    [session],
  )

  const DocsMenuItems = () => {
    return (
      <>
        {categories?.map((category, i) => {
          return (
            <Box key={i} pt={4}>
              <Text fontSize='sm' opacity={0.5} mb={1}>
                {category}
              </Text>
              {menuItems
                .filter((m) => m.category === category)
                ?.map((menuItem, j) => {
                  return (
                    <Box key={j}>
                      <Link href={menuItem.slug}>
                        <Button
                          w='100%'
                          textAlign='left'
                          justifyContent='flex-start'
                          variant={
                            menuItem.slug === doc.slug ? 'solid' : 'ghost'
                          }
                        >
                          {menuItem.title}
                        </Button>
                      </Link>
                    </Box>
                  )
                })}
            </Box>
          )
        })}
      </>
    )
  }

  const DocsMenu = () => {
    return (
      <Box
        minW={MENU_WIDTH}
        maxW={MENU_WIDTH}
        pt={10}
        overflow='scroll'
        maxH='calc(100vh - 64px)'
        position='sticky'
        top={MENU_HEIGHT}
        pb={10}
      >
        <DocsMenuItems />
      </Box>
    )
  }

  const OnThisPageLinks = () => {
    return (
      <>
        {onThisPageItems.map((header, i) => {
          return (
            <Box key={i} pl={((header.level || 0) - 2) * 4} pt={2}>
              <Link
                href={`#${header.text
                  .toLocaleLowerCase()
                  .replaceAll(' ', '-')}`}
              >
                <Button
                  w='100%'
                  textAlign='left'
                  justifyContent='flex-start'
                  variant='link'
                  fontSize={header.level === 3 ? 'sm' : undefined}
                >
                  {header.text}
                </Button>
              </Link>
            </Box>
          )
        })}
      </>
    )
  }

  const OnThisPage = () => {
    return (
      <Box
        minW={MENU_WIDTH}
        maxW={MENU_WIDTH}
        pt={14}
        h='100%'
        position='sticky'
        top={MENU_HEIGHT}
        maxH='calc(100vh - 64px)'
        overflow='scroll'
        pb={10}
      >
        {onThisPageItems.length > 0 && (
          <Text fontSize='sm' opacity={0.5} mb={1}>
            On this page
          </Text>
        )}
        <OnThisPageLinks />
      </Box>
    )
  }

  const OnThisPageSmallScreen = () => {
    return (
      <Box mb={-8} mt={6} zIndex={2}>
        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as='span' flex='1' textAlign='left'>
                  Docs
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={8}>
              <DocsMenuItems />
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as='span' flex='1' textAlign='left'>
                  On this page
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <OnThisPageLinks />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    )
  }

  const Content = () => {
    return (
      <Flex w='100%' flexDir='column' pb={40} pt={5}>
        <RenderMarkdown>{doc.content}</RenderMarkdown>
      </Flex>
    )
  }

  return (
    <Wrapper>
      <Container maxWidth={MEDIUM_CONTAINER_WIDTH}>
        <Flex
          gap={{
            base: 0,
            md: 8,
          }}
          flexDir={{
            base: 'column',
            md: 'row',
          }}
          position='relative'
        >
          {!isSmallScreen && <DocsMenu />}
          {isSmallScreen && <OnThisPageSmallScreen />}
          <Content />
          {!isSmallScreen && <OnThisPage />}
        </Flex>
      </Container>
    </Wrapper>
  )
}

export default Docs

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const doc = getDocBySlug(params.slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
  ])

  const menuItems = getAllDocs(['slug', 'title', 'position', 'category'])
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      position: doc.position,
      category: doc.category || null,
    }))
    .sort((doc1, doc2) => (doc1.position < doc2.position ? -1 : 1))

  const publicPages = getAllPublicPages([
    'slug',
    'title',
    'footerCategory',
    'menuTitle',
  ]) as Omit<PublicPage, 'content'>[]

  return {
    props: {
      doc: {
        ...doc,
        content: doc.content,
      },
      menuItems,
      publicPages,
    },
  }
}

export async function getStaticPaths() {
  const docs = getAllDocs(['slug'])

  return {
    paths: docs.map((doc) => {
      return {
        params: {
          slug: doc.slug,
        },
      }
    }),
    fallback: false,
  }
}
