import { FC } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Text,
  useToast,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { ProjectRole } from '@prisma/client'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { Avatar, SkeletonPlaceholder } from 'components'

type Props = {
  param?: string
}

const ProjectMembersTable: FC<Props> = () => {
  const { query, push } = useRouter()
  const { data: project } = api.project.project.useQuery({
    handle: query.projectHandle as string,
  })
  const { data: me } = api.me.me.useQuery()
  const utils = api.useContext()
  const toast = useToast()
  const { confirm } = useConfirm()

  const changeRole = api.project.changeRole.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while changing role',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully changed role`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.project.project.invalidate()
    },
  })

  const removeMember = api.project.removeMember.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while removing team member',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully removed team member`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.project.project.invalidate()
    },
  })

  const leaveProject = api.project.leaveProject.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while leaving the project',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully left the project`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.project.project.invalidate()
      utils.me.me.invalidate()
      push('/projects')
    },
  })

  const members = project?.projectMemberships?.map((m) => {
    return {
      id: m.id,
      userId: m.user?.id,
      avatarHue: m.user?.avatarHue,
      name: m.user?.fullName,
      email: m.user?.email || m.invitationMailSentTo,
      invitationAcceptedAt: m.invitationAcceptedAt,
      role: m.projectRole,
    }
  })

  const myMembership = project?.projectMemberships?.find(
    (m) => m.user?.id === me?.id,
  )

  const isOwner = myMembership?.projectRole === 'PROJECT_OWNER'

  if (!members) {
    return <SkeletonPlaceholder />
  }

  const changeRoleWrapper = (
    membershipToChangeRole: string,
    changeRoleTo: 'PROJECT_OWNER' | 'MEMBER',
  ) => {
    changeRole.mutateAsync({
      projectHandle: query.projectHandle as string,
      membershipToChangeRole,
      changeRoleTo,
    })
  }
  const isOnlyOwner =
    isOwner &&
    project?.projectMemberships?.filter(
      (membership) => membership.projectRole === 'PROJECT_OWNER',
    ).length === 1

  const onLeaveProjectClicked = () => {
    leaveProject.mutate({
      projectHandle: query.projectHandle as string,
    })
  }

  const onDeleteClicked = (membershipId: string, userId?: string | null) => {
    if (userId === me?.id) {
      if (isOnlyOwner) {
        confirm({
          title: 'Warning',
          message: `You are the only team leader of this project. To leave this project, you need to add another team leader first.`,
        })
      } else {
        confirm({
          title: 'Remove yourself',
          message: `Are you sure you want to remove yourself from this project?`,
          confirmText: 'Remove',
          isDanger: true,
          onConfirm: onLeaveProjectClicked,
        })
      }
    } else {
      confirm({
        title: 'Remove member',
        message: 'Are you sure you want to remove this team member?',
        confirmText: 'Remove',
        isDanger: true,
        onConfirm: () => {
          removeMember.mutateAsync({
            projectHandle: query.projectHandle as string,
            membershipToRemove: membershipId,
          })
        },
      })
    }
  }

  const More = ({
    membershipId,
    userId,
  }: {
    membershipId: string
    userId?: string | null
  }) => {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={''}
          ml={2}
          variant='ghost'
          icon={<BsThreeDotsVertical />}
        />
        <Portal>
          <MenuList>
            <MenuItem
              icon={<BsTrash />}
              onClick={() => onDeleteClicked(membershipId, userId)}
            >
              Remove
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  const AvatarAndName = ({
    name,
    hue,
    userId,
  }: {
    name?: string | null
    hue?: number | null
    userId?: string
  }) => {
    return (
      <Flex alignItems='center'>
        <Box mr={3}>
          <Avatar size='sm' name={name} hue={hue} />
        </Box>
        {name ? <Text>{name}</Text> : <Text opacity={0.5}>No name</Text>}
        {userId === me?.id && <Text ml={2}>(You)</Text>}
      </Flex>
    )
  }

  const RoleSelector = ({
    membershipId,
    email,
    name,
    invitationAcceptedAt,
    role,
  }: {
    membershipId: string
    email: string | null
    name?: string | null
    invitationAcceptedAt?: Date | null
    role: ProjectRole
  }) => {
    return (
      <Flex justifyContent='space-between' alignItems='center'>
        {invitationAcceptedAt ? (
          <Menu>
            <MenuButton
              as={Button}
              aria-label={''}
              variant='ghost'
              rightIcon={<ChevronDownIcon />}
            >
              {role === ProjectRole.PROJECT_OWNER
                ? 'Team Leader'
                : 'Team Member'}
            </MenuButton>
            <Portal>
              <MenuList>
                <MenuItem
                  isDisabled={role === ProjectRole.PROJECT_OWNER}
                  onClick={() =>
                    confirm({
                      title: 'Change role',
                      message: `Are you sure you want to change the role of ${
                        name || email
                      } to team leader?`,
                      confirmText: 'Change role',
                      onConfirm: () =>
                        changeRoleWrapper(membershipId, 'PROJECT_OWNER'),
                    })
                  }
                >
                  Team Leader
                </MenuItem>
                <MenuItem
                  isDisabled={role === 'MEMBER'}
                  onClick={() => {
                    if (isOnlyOwner) {
                      confirm({
                        title: 'Warning',
                        message: `You are the only team leader of this project. To change the role, you need to add another team leader first.`,
                      })
                    } else {
                      confirm({
                        title: 'Change role',
                        message: `Are you sure you want to change the role of ${
                          name || email
                        } to team member?`,
                        confirmText: 'Change role',
                        onConfirm: () =>
                          changeRoleWrapper(membershipId, 'MEMBER'),
                      })
                    }
                  }}
                >
                  Member
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        ) : (
          <Text mr={1} opacity={0.5}>
            Pending invitation
          </Text>
        )}
      </Flex>
    )
  }

  return (
    <Box mt={6}>
      {members.map((m, i) => {
        const isLast = i === members.length - 1

        return (
          <Box key={i}>
            <Flex
              key={m.id}
              alignItems={{
                base: 'flex-start',
                md: 'center',
              }}
              justifyContent='space-between'
              flexDir={{
                base: 'column',
                md: 'row',
              }}
            >
              <Flex
                alignItems='center'
                gap={2}
                flexDir={{
                  base: 'column',
                  md: 'row',
                }}
              >
                <AvatarAndName
                  name={m.name}
                  userId={m.userId}
                  hue={m.avatarHue}
                />
                <Text opacity={0.5}>{m.email}</Text>
              </Flex>

              <Flex
                mt={{
                  base: 2,
                  md: 0,
                }}
                ml='auto'
              >
                {isOwner ? (
                  <RoleSelector
                    membershipId={m.id}
                    email={m.email}
                    name={m.name}
                    invitationAcceptedAt={m.invitationAcceptedAt}
                    role={m.role}
                  />
                ) : (
                  <Text>
                    {m.role === ProjectRole.PROJECT_OWNER
                      ? 'Team Leader'
                      : 'Team Member'}
                  </Text>
                )}
                {isOwner && <More membershipId={m.id} userId={m.userId} />}
              </Flex>
            </Flex>
            {!isLast && (
              <Flex>
                <Divider my={3} />
              </Flex>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default ProjectMembersTable
