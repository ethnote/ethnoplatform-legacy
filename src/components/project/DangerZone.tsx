import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Flex, useToast } from '@chakra-ui/react'
import { BsTrash } from 'react-icons/bs'
import { MdLogout } from 'react-icons/md'

import { api } from 'utils/api'
import { Confirm } from 'components'

type Props = {
  param?: string
}

const DangerZone: FC<Props> = () => {
  const [confirmationModalToOpen, setConfirmationModalToOpen] = useState('')
  const { query, push } = useRouter()
  const toast = useToast()
  const utils = api.useContext()

  const { data: me } = api.me.me.useQuery()

  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
    },
  )

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

  const deleteProject = api.project.deleteProject.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while deleting project',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully deleted the project`,
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

  const isOwner =
    project?.projectMemberships?.find(
      (membership) => membership.user?.id === me?.id,
    )?.projectRole === 'PROJECT_OWNER'

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

  const onDeleteProjectClicked = () => {
    deleteProject.mutate({
      projectHandle: query.projectHandle as string,
    })
  }

  return (
    <>
      <Flex
        gap={2}
        flexDir={{
          base: 'column',
          md: 'row',
        }}
      >
        <Button
          leftIcon={<MdLogout />}
          colorScheme='red'
          variant='outline'
          onClick={() =>
            setConfirmationModalToOpen(isOnlyOwner ? 'only-owner' : 'leave')
          }
        >
          Leave project
        </Button>
        {isOwner ? (
          <>
            <Button
              colorScheme='red'
              variant='outline'
              leftIcon={<BsTrash />}
              onClick={() => setConfirmationModalToOpen('delete')}
            >
              Delete project
            </Button>
          </>
        ) : (
          <></>
        )}
      </Flex>
      <Confirm
        title='Warning'
        message='You are the only owner of this project. Add another owner before leaving.'
        confirmText='Leave Project'
        isDanger
        isOpen={confirmationModalToOpen === 'only-owner'}
        onCancel={() => setConfirmationModalToOpen('')}
      />
      <Confirm
        title='Leave Project'
        message='Are you sure you want to leave this project?'
        confirmText='Leave Project'
        isDanger
        isOpen={confirmationModalToOpen === 'leave'}
        onCancel={() => setConfirmationModalToOpen('')}
        onConfirm={onLeaveProjectClicked}
        isLoading={leaveProject.isLoading}
      />
      <Confirm
        title='Delete Project'
        message='Are you sure you want to delete this project? Once deleted, all data, notes and files be permanently removed.'
        confirmText='Delete Project'
        textToEnableConfirm={project?.name || 'DELETE'}
        isDanger
        isOpen={confirmationModalToOpen === 'delete'}
        onCancel={() => setConfirmationModalToOpen('')}
        onConfirm={onDeleteProjectClicked}
        isLoading={deleteProject.isLoading}
      />
    </>
  )
}

export default DangerZone
