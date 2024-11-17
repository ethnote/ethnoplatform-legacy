import { FC, useEffect, useState } from 'react'
import { NextPage } from 'next'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Grid,
  GridItem,
  ResponsiveValue,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import moment from 'moment'
import { signOut, useSession } from 'next-auth/react'
import {
  AiFillLock,
  AiOutlineArrowRight,
  AiOutlineDownload,
} from 'react-icons/ai'
import { BsTrash } from 'react-icons/bs'
import { FaWalking } from 'react-icons/fa'
import { VscSignOut } from 'react-icons/vsc'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { useGlobalState } from 'hooks/useGlobalState'
import { useHideWithPin } from 'hooks/useHideWithPin'
import { useWalkthrough } from 'hooks/useWalkthrough'
import {
  Avatar,
  ColorPopover,
  ContentBox,
  EditableText,
  KeyboardShortcuts,
  PageDocument,
  ProjectTransferWarning,
  TransferProjectModal,
} from 'components'

const Profile: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { data: me } = api.me.me.useQuery()
  const utils = api.useContext()
  const { confirm } = useConfirm()
  const toast = useToast()
  const { isSmallScreen, isStandalone, setDidAskToDownload } = useGlobalState()
  const [tempHue, setTempHue] = useState(0)
  const { isOpen, onClose, onOpen } = useDisclosure()

  const [transerAllProjectModalIsOpen, setTranserAllProjectModalIsOpen] =
    useState(false)
  const { openPinModal } = useHideWithPin()
  const { startWalkthrough } = useWalkthrough()

  useEffect(() => {
    setTempHue(me?.avatarHue || 0)
  }, [me?.avatarHue])

  const deleteUser = api.me.deleteUser.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while deleting your account',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    async onSuccess() {
      toast({
        title: `Successfully deleted your account`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      await signOut({
        callbackUrl: '/',
      })
    },
    onSettled() {
      utils.me.me.invalidate()
      utils.project.project.invalidate()
    },
  })

  const updateUser = api.me.updateUser.useMutation({
    async onMutate(updateUser) {
      await utils.me.me.invalidate()
      const prevData = utils.me.me.getData()

      // Optimistically update the data
      const newData = {
        ...prevData,
        fullName: updateUser.fullName || null,
      } as any

      utils.me.me.setData(undefined, newData)

      return { prevData }
    },
    onError(err) {
      toast({
        title: 'An error occurred while updating your profile',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully updated your profile`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      onClose()
    },
    onSettled() {
      utils.me.me.invalidate()
      utils.project.project.invalidate()
    },
  })

  const updateName = (fullName: string | null | undefined) => {
    updateUser.mutate({ fullName })
  }

  const updateHue = () => {
    updateUser.mutate({ avatarHue: tempHue })
  }

  const ValueWithLabel = ({
    label,
    children,
    colSpan = 1,
  }: {
    label: string
    children: React.ReactNode
    colSpan?: ResponsiveValue<number | 'auto'> | undefined
  }) => (
    <GridItem colSpan={colSpan}>
      <Box mb={2}>
        <Text fontSize='sm' opacity={0.5}>
          {label}
        </Text>
        {children}
      </Box>
    </GridItem>
  )

  const onDeleteUserClick = () => {
    if (!me?.email) return
    confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete your account?',
      isDanger: true,
      confirmText: 'Delete User',
      textToEnableConfirm: me?.email,
      onConfirm: () => deleteUser.mutate(),
    })
  }

  const downloadApp = () => {
    setDidAskToDownload(false)
  }

  return (
    <AuthenticatedLayout session={session} pageTitle='Profile'>
      <PageDocument isLoading={!me} header='Profile'>
        <ContentBox>
          <Flex mt={6} flexDir={isSmallScreen ? 'column' : 'row'}>
            <Center minW='40' flexDir='column'>
              <Avatar
                size='huge'
                name={me?.fullName}
                hue={isOpen ? tempHue : me?.avatarHue}
              />
              <ColorPopover
                tempHue={tempHue}
                setTempHue={setTempHue}
                onClose={() => {
                  onClose()
                  setTempHue(0)
                }}
                onSave={updateHue}
                isOpen={isOpen}
              >
                <Button variant='outline' size='sm' mt={4} onClick={onOpen}>
                  Change color
                </Button>
              </ColorPopover>
            </Center>
            <Box
              mt={isSmallScreen ? 4 : 0}
              borderLeftWidth={isSmallScreen ? 0 : 1}
              pl={6}
              w='100%'
            >
              <Grid
                templateColumns={{
                  base: 'repeat(1, 1fr)',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                }}
              >
                <ValueWithLabel label='Email'>
                  <Text>{me?.email}</Text>
                </ValueWithLabel>
                <ValueWithLabel label='User Created At'>
                  <Text>{moment(me?.createdAt).format('MMMM Do YYYY')}</Text>
                </ValueWithLabel>
                <ValueWithLabel
                  label='Full Name'
                  colSpan={{
                    base: 1,
                    md: 2,
                  }}
                >
                  <EditableText
                    isEditable
                    value={me?.fullName}
                    onSave={updateName}
                  />
                </ValueWithLabel>
              </Grid>
            </Box>
          </Flex>
          <Center>
            <ButtonGroup
              flexDir={{
                base: 'column',
                md: 'row',
              }}
              w={{
                base: '100%',
                md: 'auto',
              }}
              spacing={{
                base: 0,
                md: 2,
              }}
              mt={4}
              variant='outline'
              gap={2}
            >
              <Button
                rightIcon={<VscSignOut />}
                onClick={() =>
                  signOut({
                    callbackUrl: '/',
                  })
                }
              >
                Sign out
              </Button>
              <Button rightIcon={<AiFillLock />} onClick={() => openPinModal()}>
                Lock with PIN
              </Button>
              {!isStandalone && (
                <Button rightIcon={<AiOutlineDownload />} onClick={downloadApp}>
                  Download app
                </Button>
              )}
              <Button rightIcon={<FaWalking />} onClick={startWalkthrough}>
                Start app walkthrough
              </Button>
            </ButtonGroup>
          </Center>
        </ContentBox>
        <KeyboardShortcuts />
        <ContentBox title='Danger Zone'>
          {me?.projectTransferInvitations?.map((invitation, i) => {
            return (
              <ProjectTransferWarning key={i} toEmail={invitation.toEmail} />
            )
          })}
          <ButtonGroup colorScheme='red' variant='outline'>
            <Button onClick={onDeleteUserClick} leftIcon={<BsTrash />}>
              Delete user
            </Button>
            <Button
              leftIcon={<AiOutlineArrowRight />}
              onClick={() => setTranserAllProjectModalIsOpen(true)}
              isDisabled={(me?.projectTransferInvitations || []).length > 0}
            >
              Transfer all projects
            </Button>
          </ButtonGroup>
        </ContentBox>
      </PageDocument>
      <TransferProjectModal
        isOpen={transerAllProjectModalIsOpen}
        onClose={() => setTranserAllProjectModalIsOpen(false)}
      />
    </AuthenticatedLayout>
  )
}

export default Profile
