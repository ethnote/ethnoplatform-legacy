import { FC, useState } from 'react'
import { NextPage } from 'next'
import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { AiOutlineArrowRight } from 'react-icons/ai'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useConfirm } from 'hooks/useConfirm'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import {
  Avatar,
  ContentBox,
  EasyTable,
  ItemIsLocked,
  PageDocument,
  Stat,
  TransferProjectBetweenUsersModal,
} from 'components'
import { TableColumn } from '../../components/common/EasyTable'

const Users: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { data: me } = api.me.me.useQuery()
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const [transerAllProjectModalIsOpen, setTranserAllProjectModalIsOpen] =
    useState(false)
  const [transferFromEmail, setTransferFromEmail] = useState<string | null>(
    null,
  )
  const { isSuperAdminKeyValid, superAdminKey } = useSuperAdminKey()

  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.superAdmin.allUsers.useInfiniteQuery(
      {
        limit: 30,
        superAdminKey,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        enabled: isSuperAdminKeyValid,
      },
    )

  const deleteUser = api.superAdmin.deleteUser.useMutation({
    onSettled() {
      utils.superAdmin.allUsers.invalidate()
    },
  })

  const allUsers = data?.pages
    .flatMap((page) => page.users)
    .map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      avatarHue: u.avatarHue,
      createdAt: u.createdAt,
      projectCount: u._count?.projectMemberships,
      noteCount: u._count?.notes,
      commentsCount: u._count?.comments,
    }))

  type AdminAllUser = NonNullable<typeof allUsers>[0]

  const columns = [
    {
      render: (_, allValues) => (
        <Avatar name={allValues.fullName} hue={allValues.avatarHue} size='xs' />
      ),
    },
    {
      key: 'fullName',
      title: 'Full Name',
      render: (value) => value,
    },
    {
      key: 'email',
      title: 'Email',
      render: (value) => value,
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value) => moment(value).fromNow(),
    },
    {
      key: 'projectCount',
      title: '# of projects',
      render: (value) => value,
    },
    {
      key: 'noteCount',
      title: '# of notes',
      render: (value) => value,
    },
    {
      key: 'commentsCount',
      title: '# of comments',
      render: (value) => value,
    },
    {
      render: (_, allValues) =>
        allValues.email !== me?.email && (
          <EditButton userId={allValues.id} userEmail={allValues.email} />
        ),
    },
  ] as TableColumn<AdminAllUser>[]

  const totalAmountOfUsers = data?.pages[0]?.userCount ?? 0
  const totalAmountOfUsersLastWeek = data?.pages[0]?.userCountLastWeek ?? 0

  const onDeleteClicked = (userId: string, userEmail: string | null) => {
    if (!userEmail) return
    confirm({
      title: 'Delete user',
      message: 'Are you sure you want to delete this user?',
      isDanger: true,
      confirmText: 'Delete',
      textToEnableConfirm: userEmail,
      onConfirm: () =>
        deleteUser.mutate({
          userId,
        }),
    })
  }

  const EditButton = ({
    userId,
    userEmail,
  }: {
    userId: string
    userEmail: string | null
  }) => {
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
        />
        <Portal>
          <MenuList>
            <MenuItem
              icon={<BsTrash />}
              onClick={() => onDeleteClicked(userId, userEmail)}
            >
              Delete
            </MenuItem>
            <MenuItem
              icon={<AiOutlineArrowRight />}
              onClick={() => {
                setTransferFromEmail(userEmail)
                setTranserAllProjectModalIsOpen(true)
              }}
            >
              Transfer All Projects
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  return (
    <AuthenticatedLayout session={session} pageTitle={'Users | Admin'}>
      <PageDocument extraWide header={'Users'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              <Stat
                label='Total amount of users'
                value={totalAmountOfUsers}
                prevNumber={totalAmountOfUsersLastWeek}
                isLoading={isLoading}
              />
            </ContentBox>
            <ContentBox>
              <EasyTable<AdminAllUser>
                data={allUsers ?? []}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                columns={columns}
                size='sm'
                isLoading={isLoading}
              />
            </ContentBox>
          </>
        )}
      </PageDocument>
      <TransferProjectBetweenUsersModal
        isOpen={transerAllProjectModalIsOpen}
        onClose={() => setTranserAllProjectModalIsOpen(false)}
        transferFromEmail={transferFromEmail}
      />
    </AuthenticatedLayout>
  )
}

export default Users
