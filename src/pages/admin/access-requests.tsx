import { FC } from 'react'
import { NextPage } from 'next'
import { ButtonGroup, IconButton, useToast } from '@chakra-ui/react'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useConfirm } from 'hooks/useConfirm'
import { ContentBox, EasyTable, PageDocument, Stat } from 'components'
import { TableColumn } from '../../components/common/EasyTable'

const AccessRequests: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const toast = useToast()

  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.superAdmin.allAccessRequests.useInfiniteQuery(
      {
        limit: 30,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    )
  const acceptAccessRequest = api.superAdmin.acceptAccessRequest.useMutation({
    onSettled() {
      utils.superAdmin.allAccessRequests.invalidate()
    },
    onSuccess() {
      toast({
        title: 'Access request accepted',
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
  })

  const deleteAccessRequest = api.superAdmin.deleteAccessRequest.useMutation({
    onSettled() {
      utils.superAdmin.allAccessRequests.invalidate()
    },
  })

  const allAccessRequests = data?.pages.flatMap((page) => page.accessRequests)

  type AdminAllAccessRequest = NonNullable<typeof allAccessRequests>[0]

  const columns = [
    {
      render: (_, allValues) => (
        <ButtonGroup size='sm' variant='outline'>
          <IconButton
            icon={<AiOutlineCheck />}
            colorScheme='green'
            onClick={() => onAcceptClick(allValues.id)}
            aria-label='Accept access request'
          />
          <IconButton
            icon={<AiOutlineClose />}
            colorScheme='red'
            onClick={() => onDeleteClicked(allValues.id)}
            aria-label='Delete access request'
          />
        </ButtonGroup>
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
      key: 'institution',
      title: 'Organization',
      render: (value) => value,
    },
    {
      key: 'intendedUse',
      title: 'Purpose',
      render: (value) => value,
    },
  ] as TableColumn<AdminAllAccessRequest>[]

  const totalAmountOfAccessRequests = data?.pages[0]?.accessRequestCount ?? 0
  const totalAmountOfAccessRequestsLastWeek =
    data?.pages[0]?.accessRequestCountLastWeek ?? 0

  const onAcceptClick = (accessRequestId: string) => {
    acceptAccessRequest.mutate({
      accessRequestId,
    })
  }

  const onDeleteClicked = (accessRequestId: string) => {
    confirm({
      title: 'Delete Access Request',
      message: 'Are you sure you want to delete this access request?',
      isDanger: true,
      confirmText: 'Delete',
      onConfirm: () =>
        deleteAccessRequest.mutate({
          accessRequestId,
        }),
    })
  }

  return (
    <AuthenticatedLayout
      session={session}
      pageTitle={'Access Requests | Admin'}
    >
      <PageDocument extraWide header={'Access Requests'} tabs={tabs}>
        <ContentBox>
          <Stat
            label='Total amount of access requests'
            value={totalAmountOfAccessRequests}
            prevNumber={totalAmountOfAccessRequestsLastWeek}
            isLoading={isLoading}
          />
        </ContentBox>
        <ContentBox>
          <EasyTable<AdminAllAccessRequest>
            data={allAccessRequests ?? []}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            columns={columns}
            size='sm'
            isLoading={isLoading}
          />
        </ContentBox>
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default AccessRequests
