import { FC } from 'react'
import Link from 'next/link'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Spinner,
  Text,
} from '@chakra-ui/react'
import { AiOutlineMenu } from 'react-icons/ai'
import { RxSlash } from 'react-icons/rx'

import { useGlobalState } from 'hooks/useGlobalState'
import { Walkthrough } from 'components'
import SkeletonPlaceholder from './SkeletonPlaceholder'

type Props = {
  header?: string
  children?: any
  isLoading?: boolean
  breadcrumbs?: { label: string; href: string }[]
  tabs?: {
    label: string
    href: string
    isActive: boolean
    icon?: React.ReactElement
    walkthroughStepKey?: string
  }[]
  isSaving?: boolean
  saveText?: string
  extraWide?: boolean
}

export const DOCUMENT_WIDTH = '1140px'

const PageDocument: FC<Props> = (p) => {
  const { isSmallScreen } = useGlobalState()

  const documentWidth = p.extraWide ? '1440px' : DOCUMENT_WIDTH

  const Breadcrumbs = () => {
    return (
      <Flex minW={0} maxW='94vw' overflow='scroll'>
        {p.breadcrumbs?.map((b, i) => {
          const isLast = i === (p.breadcrumbs || []).length - 1
          const Wrapper = isLast ? Box : Link
          return (
            <Flex key={i} alignItems='center'>
              <Wrapper href={b.href}>
                <Text
                  isTruncated={isLast}
                  whiteSpace='nowrap'
                  fontSize={14}
                  fontWeight={500}
                  opacity={isLast ? 1 : 0.5}
                >
                  {b.label}
                </Text>
              </Wrapper>
              {!isLast && <RxSlash opacity={0.5} />}
            </Flex>
          )
        })}
      </Flex>
    )
  }

  if (p.isLoading)
    return (
      <Container maxWidth={documentWidth} pb={10} pt={10}>
        <Flex
          justifyContent='space-between'
          alignItems='flex-end'
          mb={6}
          mt={7}
        >
          <Heading isTruncated fontSize={30}>
            {p.header}
          </Heading>
        </Flex>
        <SkeletonPlaceholder />
      </Container>
    )

  return (
    <Flex w='100%' minH='100%' flexDir='column'>
      <Container
        maxWidth={documentWidth}
        pt={10}
        px={{
          base: 3,
          md: 4,
        }}
      >
        <Flex justifyContent='space-between' alignItems='flex-end' mb={6}>
          <Box>
            <Box h={7}>
              <Breadcrumbs />
            </Box>
            <Flex alignItems='center'>
              <Heading isTruncated fontSize={30}>
                {p.header}
              </Heading>
              {p.isSaving && (
                <Flex alignItems='center'>
                  <Text fontSize='sm' opacity={0.5} ml={3}>
                    Saving
                  </Text>
                  <Flex h='100%'>
                    <Spinner opacity={0.4} size='sm' ml={2} />
                  </Flex>
                </Flex>
              )}
              {p.saveText && !p.isSaving && (
                <Flex alignItems='center' ml={3}>
                  <Text fontSize='sm' opacity={0.5}>
                    {p.saveText}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Box>
          {p.tabs &&
            (!isSmallScreen ? (
              <ButtonGroup>
                {p.tabs.map((t, i) => (
                  // <Tooltip key={i} label={t.label}>
                  <Link key={i} href={t.href}>
                    <Walkthrough stepKey={t.walkthroughStepKey}>
                      {(nextStep) => (
                        <Button
                          leftIcon={t.icon}
                          // icon={t.icon}
                          // as={t.isActive ? Button : IconButton}
                          variant={t.isActive ? 'outline' : 'ghost'}
                          borderWidth={1}
                          borderColor={t.isActive ? undefined : 'transparent'}
                          bg={t.isActive ? undefined : 'transparent'}
                          onClick={() => nextStep()}
                        >
                          {t.label}
                        </Button>
                      )}
                    </Walkthrough>
                  </Link>
                  // </Tooltip>
                ))}
              </ButtonGroup>
            ) : (
              <Menu>
                <Walkthrough
                  stepKey={
                    p.tabs.find((t) => t.walkthroughStepKey)?.walkthroughStepKey
                  }
                >
                  {(nextStep) => (
                    <MenuButton
                      mr={2}
                      fontWeight='normal'
                      as={IconButton}
                      icon={<AiOutlineMenu />}
                      aria-label={'Menu'}
                      variant='ghost'
                      size='md'
                      onClick={() => nextStep()}
                    />
                  )}
                </Walkthrough>
                <Portal>
                  <MenuList>
                    {p.tabs.map((t, i) => (
                      <Link key={i} href={t.href}>
                        <MenuItem icon={t.icon} onClick={() => {}} key={i}>
                          {t.label}
                        </MenuItem>
                      </Link>
                    ))}
                  </MenuList>
                </Portal>
              </Menu>
            ))}
        </Flex>
      </Container>

      <Container
        maxWidth={documentWidth}
        pb={16}
        px={{
          base: 0,
          md: 4,
        }}
      >
        {p.children}
      </Container>
    </Flex>
  )
}

export default PageDocument
