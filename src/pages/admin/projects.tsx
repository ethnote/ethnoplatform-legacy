import { FC } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Switch,
  Text,
} from '@chakra-ui/react'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { useQueryState } from 'nuqs'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useConfirm } from 'hooks/useConfirm'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import {
  ContentBox,
  EasyTable,
  ItemIsLocked,
  PageDocument,
  Stat,
} from 'components'
import { TableColumn } from '../../components/common/EasyTable'

const Projects: FC<NextPage> = () => {
  const [showOnlyInactive, setShowInActive] = useQueryState('showOnlyInactive')

  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { push } = useRouter()
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const { isSuperAdminKeyValid, superAdminKey } = useSuperAdminKey()

  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.superAdmin.allProjects.useInfiniteQuery(
      {
        limit: 30,
        showOnlyInactive: !!showOnlyInactive,
        superAdminKey,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        enabled: isSuperAdminKeyValid,
      },
    )

  const deleteProject = api.superAdmin.deleteProject.useMutation({
    onSettled() {
      utils.superAdmin.allProjects.invalidate()
    },
  })

  const allProjects = data?.pages
    .flatMap((page) => page.projects)
    .map((u) => ({
      id: u.id,
      name: u.name,
      createdAt: u.createdAt,
      memberCount: u._count?.projectMemberships,
      noteCount: u._count?.notes,
      handle: u.handle,
    }))

  type AdminAllProject = NonNullable<typeof allProjects>[0]

  const columns = [
    {
      key: 'name',
      title: 'Project Name',
      render: (value) => value,
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value) => moment(value).fromNow(),
    },
    {
      key: 'memberCount',
      title: '# of members',
      render: (value) => value,
    },
    {
      key: 'noteCount',
      title: '# of notes',
      render: (value) => value,
    },
    {
      render: (_, allValues) => <EditButton projectId={allValues.id} />,
    },
  ] as TableColumn<AdminAllProject>[]

  const totalAmountOfProjects = data?.pages[0]?.projectCount ?? 0
  const totalAmountOfProjectsLastWeek =
    data?.pages[0]?.projectCountLastWeek ?? 0

  const onDeleteClicked = (projectId: string) => {
    confirm({
      title: 'Delete project',
      message: 'Are you sure you want to delete this project?',
      isDanger: true,
      confirmText: 'Delete',
      textToEnableConfirm: 'DELETE',
      onConfirm: () =>
        deleteProject.mutate({
          projectId,
        }),
    })
  }

  const EditButton = ({ projectId }: { projectId: string }) => {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={'Edit'}
          ml={2}
          variant='ghost'
          icon={<BsThreeDotsVertical />}
          size='sm'
          my={-1.5}
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
        <Portal>
          <MenuList>
            <MenuItem
              icon={<BsTrash />}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClicked(projectId)
              }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  return (
    <AuthenticatedLayout session={session} pageTitle={'Projects | Admin'}>
      <PageDocument extraWide header={'Projects'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              <Stat
                label='Total amount of projects'
                value={totalAmountOfProjects}
                prevNumber={totalAmountOfProjectsLastWeek}
                isLoading={isLoading}
              />
            </ContentBox>
            <ContentBox>
              <Flex gap={2} mb={2}>
                <Switch
                  isChecked={!!showOnlyInactive}
                  onChange={(e) => {
                    setShowInActive(e.target.checked ? '1' : null)
                  }}
                />
                <Text>Show only inactive projects</Text>
              </Flex>
              <EasyTable<AdminAllProject>
                data={allProjects ?? []}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                columns={columns}
                size='sm'
                isLoading={isLoading}
                onRowClick={(row) => {
                  push(`/projects/${row.handle}/notes`)
                }}
              />
            </ContentBox>
          </>
        )}
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default Projects
