import { FC, useEffect } from 'react'
import { NextPage } from 'next'
import { Center, Text } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { useSession } from 'next-auth/react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { AppRouter } from 'server/api/root'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { ContentBox, NotificationCard, PageDocument } from 'components'

const Profile: FC<NextPage> = () => {
  const { data: session } = useSession()
  const notificationsSeen = api.me.notificationsSeen.useMutation()

  const {
    data: myNotifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = api.me.myNotifications.useInfiniteQuery(
    {
      limit: 15,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
    },
  )

  useEffect(() => {
    notificationsSeen.mutate()
  }, [myNotifications])

  const notifications = (myNotifications?.pages
    .flatMap((page) => page?.notifications)
    .filter(Boolean) ?? []) as NonNullable<
    NonNullable<
      inferRouterOutputs<AppRouter>['me']['myNotifications']
    >['notifications']
  >

  return (
    <AuthenticatedLayout session={session} pageTitle='Notifications'>
      <PageDocument isLoading={isLoading} header='Notifications'>
        <ContentBox>
          <>
            <InfiniteScroll
              dataLength={notifications.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={<h4>Loading...</h4>}
              // endMessage={<Text textAlign='center'>No more notifications</Text>}
              style={{ overflow: 'unset' }}
            >
              {notifications.map((n) => (
                <NotificationCard key={n.id} notification={n} />
              ))}
            </InfiniteScroll>
            {notifications.length === 0 && (
              <Center>
                <Text opacity={0.5}>No notifications to show</Text>
              </Center>
            )}
          </>
        </ContentBox>
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default Profile
