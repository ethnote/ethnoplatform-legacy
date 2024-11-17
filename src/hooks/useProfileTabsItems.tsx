import { useRouter } from 'next/router'
import { AiOutlineUser } from 'react-icons/ai'
import { IoNotificationsOutline } from 'react-icons/io5'

export const useProfileTabsItems = () => {
  const { pathname } = useRouter()
  return [
    {
      label: 'Profile',
      href: `/profile`,
      isActive: pathname.endsWith('/profile'),
      icon: <AiOutlineUser />,
    },
    {
      label: 'Notifications',
      href: '/profile/notifications',
      isActive: pathname.endsWith('/profile/notifications'),
      icon: <IoNotificationsOutline />,
    },
  ]
}
