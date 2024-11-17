import { useEffect, type FC } from 'react'
import { useRouter } from 'next/router'
import { Box } from '@chakra-ui/react'
import { Session } from 'next-auth'

import { api } from 'utils/api'
import { Menu, SkeletonPlaceholder, SupportButton } from 'components'
import BaseLayout, { BaseLayoutProps } from './BaseLayout'

type Props = BaseLayoutProps & {
  session: Session | null
  isLoading?: boolean
  noAuth?: boolean
}

const AuthenticatedLayout: FC<Props> = (p: Props) => {
  const { push, asPath } = useRouter()
  const { data: me } = api.me.me.useQuery()

  useEffect(() => {
    if (p.session === null) {
      if (p.noAuth) return
      push('/signin?callbackUrl=%2Fprojects')
    }
  }, [push, p.session])

  const isLoading = !p.noAuth && (p.session === undefined || p.isLoading || !me)

  /**
   * If we're online while we load, redirect to quick notes (but not if we're inside a project)
   */

  useEffect(() => {
    const isOnline = typeof window !== 'undefined' && navigator?.onLine

    const isInProject = asPath.startsWith('/projects/')

    if (!isOnline && isLoading && !isInProject) {
      push('/quick-notes')
    }
  }, [isLoading])

  return (
    <BaseLayout {...p}>
      <Box w='100%' position='relative'>
        <Menu />
        <Box w='100%' zIndex={1}>
          {isLoading ? <SkeletonPlaceholder withHeader /> : p.children}
        </Box>
        <SupportButton />
      </Box>
    </BaseLayout>
  )
}

export default AuthenticatedLayout
