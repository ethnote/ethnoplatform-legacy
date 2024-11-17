import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import { BIG_CONTAINER_WIDTH } from 'constants/constants'
import { useSession } from 'next-auth/react'
import { BiMoon, BiSun } from 'react-icons/bi'
import { IoMenu } from 'react-icons/io5'
import { PublicPage } from 'types/publicPage'

import { useGlobalState } from 'hooks/useGlobalState'
import { useIsOnline } from 'hooks/useIsOnline'
import { useStyle } from 'hooks/useStyle'
import { ButtonVariant, Logo } from 'components'
import { MENU_HEIGHT } from 'components/common/Menu'

type Props = {
  publicPages: Omit<PublicPage, 'content'>[]
}

const LandingPageMenu: FC<Props> = (p) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { menuBg, back, contentBoxBorder } = useStyle()
  const { data: session } = useSession()
  const { asPath } = useRouter()
  const { isSmallScreen } = useGlobalState()
  const { isOnline } = useIsOnline()

  const ModeButton = () => {
    const text = `Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`
    return (
      <Tooltip label={text} placement='bottom'>
        <IconButton
          variant='ghost'
          icon={colorMode === 'dark' ? <BiSun /> : <BiMoon />}
          aria-label={text}
          onClick={toggleColorMode}
        />
      </Tooltip>
    )
  }

  const scrollToRequestAccess = () => {
    const element = document.getElementById('request-access')
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    })
  }

  const options = [
    {
      title: 'Home',
      slug: '/',
      match: '/',
    },
    // ...p.publicPages
    //   .filter((p) => !!p.menuTitle)
    //   .map((page) => ({ slug: `/${page.slug}`, title: page.menuTitle })),
    // {
    //   title: 'Documentation',
    //   slug: '/docs/getting-started',
    //   startsWith: '/docs',
    // },
    !!session && {
      title: 'Go to app',
      slug: '/projects',
      isButtonVariant: true,
    },
    !session && {
      title: 'Login',
      slug: '/projects',
    },
    !isOnline && {
      title: 'Quick notes',
      slug: '/quick-notes',
    },
    !session && {
      title: 'Request access',
      slug: '/projects',
      onClick: scrollToRequestAccess,
      isButtonVariant: true,
    },
  ].filter(Boolean) as {
    title: string
    slug: string
    match?: string
    startsWith?: string
    onClick?: () => void
    isButtonVariant?: boolean
  }[]

  return (
    <Box minH={MENU_HEIGHT} w='100%' position='relative'>
      <Box
        h={MENU_HEIGHT}
        w='100%'
        bg={menuBg}
        __css={{
          backdropFilter: 'auto',
          backdropBlur: '6px',
        }}
        position='fixed'
        top={0}
        zIndex={3}
        boxShadow={`0px 4px 4px ${back}80`}
        borderBottomColor={contentBoxBorder}
        borderBottomWidth={1}
        // bg={lighterBg}
        backdropFilter='auto'
        backdropBlur='10px'
      >
        <Container px={6} maxWidth={BIG_CONTAINER_WIDTH} h='100%'>
          <Flex alignItems='center' h='100%' justifyContent='space-between'>
            <Link href='/'>
              <Logo hideText={isSmallScreen} />
            </Link>
            {isSmallScreen ? (
              <ButtonGroup>
                <ModeButton />
                <Menu>
                  <MenuButton as={IconButton} icon={<IoMenu />} />
                  <MenuList>
                    {options.map((option) => {
                      if (option.onClick) {
                        return (
                          <MenuItem onClick={option.onClick} key={option.slug}>
                            {option.title}
                          </MenuItem>
                        )
                      }

                      return (
                        <Link href={option.slug} key={option.slug}>
                          <MenuItem>{option.title}</MenuItem>
                        </Link>
                      )
                    })}
                  </MenuList>
                </Menu>
              </ButtonGroup>
            ) : (
              <Flex>
                <ButtonGroup alignItems='center' variant='ghost'>
                  {options.map((option) => {
                    const isActive = option.match
                      ? asPath === option.match
                      : option.startsWith
                        ? asPath.startsWith(option.startsWith)
                        : asPath.startsWith(option.slug)

                    if (option.onClick) {
                      return (
                        <Button
                          key={option.slug}
                          onClick={option.onClick}
                          variant={isActive ? 'outline' : 'ghost'}
                        >
                          {option.title}
                        </Button>
                      )
                    }

                    if (option.isButtonVariant) {
                      return (
                        <Link href={option.slug} key={option.slug}>
                          <ButtonVariant
                            variant={isActive ? 'outline' : 'ghost'}
                          >
                            {option.title}
                          </ButtonVariant>
                        </Link>
                      )
                    }

                    return (
                      <Link href={option.slug} key={option.slug}>
                        <Button variant={isActive ? 'outline' : 'ghost'}>
                          {option.title}
                        </Button>
                      </Link>
                    )
                  })}
                  <ModeButton />
                </ButtonGroup>
              </Flex>
            )}
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPageMenu
