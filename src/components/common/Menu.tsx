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
  Text,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react'
import { BIG_CONTAINER_WIDTH } from 'constants/constants'
import { AiOutlineBell, AiOutlineLock } from 'react-icons/ai'
import { BiMoon, BiSun } from 'react-icons/bi'
import { BsBook, BsGrid } from 'react-icons/bs'
import { IoCloudOfflineOutline } from 'react-icons/io5'
import { MdOutlineAdminPanelSettings } from 'react-icons/md'

import { api } from 'utils/api'
import { useGlobalState } from 'hooks/useGlobalState'
import { useHideWithPin } from 'hooks/useHideWithPin'
import { useIsOnline } from 'hooks/useIsOnline'
import { useNotifications } from 'hooks/useNotifications'
import { useStyle } from 'hooks/useStyle'
import { Avatar, Logo } from 'components'

type Props = {
  param?: string
}

export const MENU_HEIGHT = 16

const Menu: FC<Props> = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { asPath, push } = useRouter()
  const { menuBg, back, contentBoxBorder, hoverBg, borderColor } = useStyle()
  const { isOnline } = useIsOnline()
  const { notificationCount } = useNotifications()
  const { openPinModal } = useHideWithPin()
  const me = api.me.me.useQuery()
  const { isSmallScreen } = useGlobalState()

  const options = [
    {
      label: 'My projects',
      href: '/projects',
      icon: <BsGrid />,
      isActive: asPath === '/projects',
    },
    {
      label: 'Notifications',
      href: '/profile/notifications',
      icon: <AiOutlineBell />,
      isActive: asPath.startsWith('/profile/notifications'),
      notifications: !!notificationCount,
    },
    // {
    //   label: 'Docs',
    //   href: '/docs/getting-started',
    //   icon: <BsBook />,
    //   isActive: asPath.startsWith('/docs'),
    // },
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <Avatar
          size='xs'
          ml={{
            base: 0,
            md: -1,
          }}
          hideTooltip={true}
          name={me.data?.fullName || ''}
          hue={me.data?.avatarHue}
        />
      ),
      isActive: asPath === '/profile',
    },
    me.data?.isSuperAdmin && {
      label: 'Admin',
      href: '/admin/usage',
      icon: <MdOutlineAdminPanelSettings />,
      isActive: asPath.startsWith('/admin'),
    },
  ].filter(Boolean) as {
    label: string
    href: string
    icon: JSX.Element
    isActive: boolean
    notifications?: boolean
  }[]

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

  const LockButton = () => {
    return (
      <Tooltip label={'Lock with PIN'} placement='bottom'>
        <IconButton
          variant='ghost'
          icon={<AiOutlineLock />}
          aria-label={'Lock with PIN'}
          onClick={openPinModal}
        />
      </Tooltip>
    )
  }

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
        backdropFilter='auto'
        backdropBlur='10px'
      >
        <Container
          pr={{
            base: 2,
            md: 6,
          }}
          pl={{
            base: 5,
            md: 6,
          }}
          maxWidth={BIG_CONTAINER_WIDTH}
          h='100%'
        >
          <Flex alignItems='center' h='100%' justifyContent='space-between'>
            <Link href='/'>
              <Logo hideText={isSmallScreen} />
            </Link>
            {/* <Button
              name='Search'
              variant='solid'
              bg={bgMoreSemiTransparent}
              maxW={'500px'}
              minW={'300px'}
              mx={8}
            >
              <Flex w='100%' alignItems='center'>
                <AiOutlineSearch />
                <Text ml={2}>Search</Text>
                <Flex justifyContent='flex-end' w='100%'>
                  <Kbd mr={1}>⌘</Kbd>
                  <Kbd>K</Kbd>
                </Flex>
              </Flex>
            </Button> */}
            <Flex>
              <ButtonGroup
                alignItems='center'
                spacing={{
                  base: 1,
                  md: 2,
                }}
              >
                <LockButton />
                <ModeButton />
                <Box
                  px={{
                    base: 1,
                    md: 0,
                  }}
                >
                  <Box h={5} maxW='1px' minW='1px' bg={borderColor} />
                </Box>
                {options.map((o, i) => (
                  <Link key={i} href={o.href}>
                    <Box position='relative'>
                      <Button
                        as={isSmallScreen ? IconButton : undefined}
                        variant={o.isActive ? 'outline' : 'ghost'}
                        leftIcon={o.icon}
                        bg='transparent'
                        icon={o.icon}
                        borderWidth={1}
                        p={{
                          base: 3,
                          md: 4,
                        }}
                        borderColor={o.isActive ? undefined : 'transparent'}
                      >
                        {o.label}
                      </Button>
                      {o.notifications && (
                        <Flex
                          position='absolute'
                          h={3}
                          w={3}
                          bg='blue.500'
                          top={0}
                          right={0}
                          borderRadius='full'
                        />
                      )}
                    </Box>
                  </Link>
                ))}
              </ButtonGroup>
            </Flex>
          </Flex>
        </Container>
      </Box>
      {!isOnline && (
        <Flex
          zIndex={1}
          mt={MENU_HEIGHT}
          w='100%'
          position='fixed'
          h={10}
          bg={hoverBg}
          justifyContent='center'
          alignItems='center'
        >
          <IoCloudOfflineOutline />
          <Text ml={2} fontSize='sm'>
            You&rsquo;re offline
          </Text>
          <Button
            size='sm'
            colorScheme='blue'
            variant='ghost'
            ml={2}
            onClick={() => push('/quick-notes')}
          >
            Go to quick notes
          </Button>
        </Flex>
      )}
    </Box>
  )
}

export default Menu
