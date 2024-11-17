import { FC, ReactElement, createContext, useContext, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'

import { api } from 'utils/api'
import { usePubNub } from './usePubNub'

type State = {
  notificationCount: number
}

const defaultValue: State = {
  notificationCount: 0,
}

export const NotificationsContext = createContext<State>(defaultValue)
export const useNotifications = (): State => useContext(NotificationsContext)

type NotificationsProviderProps = {
  children: ReactElement
}

export const NotificationsProvider: FC<NotificationsProviderProps> = (p) => {
  const toast = useToast()

  const { data: me, refetch } = api.me.me.useQuery()
  const notificationCount = me?.notifications?.length || 0

  const { listen } = usePubNub()

  useEffect(() => {
    if (!me?.id) return
    const unsubscribe = listen(`notification-${me?.id}`, ({ message }) => {
      refetch()
      const id = message.notificationId
      if (message.showNotification && !toast.isActive(id)) {
        toast({
          id,
          title: message.message,
          position: 'top-right',
          isClosable: true,
          duration: 5000,
        })
      }
    })
    return () => {
      unsubscribe()
    }
  }, [me?.id])

  return (
    <NotificationsContext.Provider
      value={{
        notificationCount,
      }}
    >
      {p.children}
    </NotificationsContext.Provider>
  )
}
