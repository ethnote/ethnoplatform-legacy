import { useEffect } from 'react'
import { type AppType } from 'next/app'
import { ChakraProvider, useColorMode } from '@chakra-ui/react'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { theme } from 'styles/theme'

import 'styles/globals.css'

import { api } from 'utils/api'
import { ConfirmProvider } from 'hooks/useConfirm'
import { CrudProvider } from 'hooks/useCrud'
import { GlobalStateProvider } from 'hooks/useGlobalState'
import { HideWithPinProvider } from 'hooks/useHideWithPin'
import { IsOnlineProvider } from 'hooks/useIsOnline'
import { NotificationsProvider } from 'hooks/useNotifications'
import { SharedHashtagsProvider } from 'hooks/useSharedHashtags'
import { SharedMentionsProvider } from 'hooks/useSharedMentions'
import { TranscriptionPlayerProvider } from 'hooks/useTranscriptionPlayer'
import { WalkthroughProvider } from 'hooks/useWalkthrough'
import { DownloadAppPrompt, NamePrompt } from 'components'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <IsOnlineProvider>
      <SessionProvider session={session}>
        <ChakraProvider theme={theme}>
          <ColorMode />
          <GlobalStateProvider>
            <HideWithPinProvider>
              <CrudProvider>
                <SharedHashtagsProvider>
                  <SharedMentionsProvider>
                    <NotificationsProvider>
                      <ConfirmProvider>
                        <WalkthroughProvider>
                          <TranscriptionPlayerProvider>
                            <>
                              <Component {...pageProps} />
                              <NamePrompt />
                              <DownloadAppPrompt />
                            </>
                          </TranscriptionPlayerProvider>
                        </WalkthroughProvider>
                      </ConfirmProvider>
                    </NotificationsProvider>
                  </SharedMentionsProvider>
                </SharedHashtagsProvider>
              </CrudProvider>
            </HideWithPinProvider>
          </GlobalStateProvider>
        </ChakraProvider>
      </SessionProvider>
    </IsOnlineProvider>
  )
}

export default api.withTRPC(MyApp)

const ColorMode = () => {
  const { colorMode, toggleColorMode } = useColorMode()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedPreference = localStorage.getItem('chakra-ui-color-mode')

    if (!storedPreference && colorMode === 'light') {
      toggleColorMode()
    }
  }, [])

  return null
}
