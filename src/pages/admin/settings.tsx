import { FC } from 'react'
import { NextPage } from 'next'
import {
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { AiOutlinePlus } from 'react-icons/ai'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminCrud } from 'hooks/useAdminCrud'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import {
  ButtonVariant,
  ContentBox,
  ItemIsLocked,
  PageDocument,
} from 'components'
import EasyTable, { TableColumn } from 'components/common/EasyTable'

const AdminDashboard: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { openAddAdmin, openDeleteAdmin } = useAdminCrud()
  const { isSuperAdminKeyValid, superAdminKey } = useSuperAdminKey()

  const { data: superAdmins, isLoading } = api.superAdmin.superAdmins.useQuery(
    {
      superAdminKey,
    },
    {
      enabled: isSuperAdminKeyValid,
    },
  )

  type SuperAdmin = NonNullable<typeof superAdmins>[0]

  const EditButton = ({ userId }: { userId: string }) => {
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
              onClick={() => openDeleteAdmin(userId)}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  const columns = [
    {
      title: 'Name',
      render: (_, values) => values.user?.fullName,
    },
    {
      title: 'Email',
      render: (_, values) => values.user?.email,
    },
    {
      title: 'Became Super Admin',
      render: (_, values) => moment(values.createdAt).fromNow(),
    },
    {
      render: (_, values) => (
        <Flex justifyContent='flex-end'>
          <EditButton userId={values.id} />
        </Flex>
      ),
    },
  ] as TableColumn<SuperAdmin>[]

  return (
    <AuthenticatedLayout session={session} pageTitle={'Settings | Admin'}>
      <PageDocument extraWide header={'Settings'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              <Flex justifyContent='space-between' mb={4}>
                <Heading mb={4} fontSize={20} textAlign={'left'}>
                  Super Admins
                </Heading>
                <ButtonVariant
                  leftIcon={<AiOutlinePlus />}
                  variant='outline'
                  colorScheme='blue'
                  onClick={() => openAddAdmin()}
                >
                  Add new super admin
                </ButtonVariant>
              </Flex>
              <EasyTable<SuperAdmin>
                data={superAdmins ?? []}
                columns={columns}
                isLoading={isLoading}
              />
            </ContentBox>
          </>
        )}
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default AdminDashboard
