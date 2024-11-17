import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Flex } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { AiOutlinePlus } from 'react-icons/ai'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import {
  ButtonVariant,
  ContentBox,
  InviteMemberModal,
  ProjectMembersTable,
  SkeletonPlaceholder,
} from 'components'

const ProjectMembers: FC = () => {
  const { data: session } = useSession()
  const { query } = useRouter()
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false)

  const { data: project, isLoading: projectIsLoading } =
    api.project.project.useQuery(
      {
        handle: query.projectHandle as string,
      },
      {
        enabled: !!query.projectHandle,
      },
    )

  if (projectIsLoading) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <SkeletonPlaceholder withHeader w='1140px' />
      </AuthenticatedLayout>
    )
  }

  const isOwner =
    project?.projectMemberships?.find(
      (membership) => membership.user?.id === session?.user.id,
    )?.projectRole === 'PROJECT_OWNER'

  return (
    <ContentBox minimizeId='settings-team' title='Team' isMinimizable>
      <Flex>
        {isOwner && (
          <ButtonVariant
            size='sm'
            leftIcon={<AiOutlinePlus />}
            variant='outline'
            colorScheme='blue'
            onClick={() => setIsInviteMemberModalOpen(true)}
          >
            Invite new team member
          </ButtonVariant>
        )}
      </Flex>
      <ProjectMembersTable />
      <InviteMemberModal
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
        projectHandle={query.projectHandle as string}
      />
    </ContentBox>
  )
}

export default ProjectMembers
