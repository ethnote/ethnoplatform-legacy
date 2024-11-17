/* eslint-disable @next/next/no-page-custom-font */
import type { FC, ReactNode } from 'react'
import Head from 'next/head'
import { Box } from '@chakra-ui/react'

import { useStyle } from 'hooks/useStyle'

export type BaseLayoutProps = {
  pageTitle: string
  children: ReactNode
}

const BaseLayout: FC<BaseLayoutProps> = (p: BaseLayoutProps) => {
  const { back } = useStyle()

  return (
    <>
      <Head>
        <title>{`${p.pageTitle} | Ethnote`}</title>
        <meta name='application-name' content='Ethnote' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Ethnote' />
        <meta
          name='description'
          content='An open source fieldnote management tool.'
        />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='theme-color' content='#000000' />

        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />

        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/favicon-16x16.png'
        />
        <link rel='manifest' href='/manifest.json' />
        <link rel='shortcut icon' href='/favicon.ico' />

        <meta property='og:type' content='website' />
        <meta property='og:title' content='Ethnote' />
        <meta
          property='og:description'
          content='An open source fieldnote management tool.'
        />
        <meta property='og:site_name' content='Ethnote' />
      </Head>
      <Box minH={'100svh'} bg={back}>
        <main>{p.children}</main>
      </Box>
    </>
  )
}

export default BaseLayout
