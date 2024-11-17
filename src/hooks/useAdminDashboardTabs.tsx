import { useRouter } from 'next/router'
import {
  AiOutlineFileImage,
  AiOutlineMail,
  AiOutlineSend,
  AiOutlineSetting,
} from 'react-icons/ai'
import { BsGraphUp, BsGrid } from 'react-icons/bs'
import { FiUsers } from 'react-icons/fi'
import { IoDocumentsOutline } from 'react-icons/io5'

export const useAdminDashboardTabs = () => {
  const { pathname } = useRouter()
  return [
    {
      label: 'Usage',
      href: `/admin/usage`,
      isActive: pathname.endsWith('/usage'),
      icon: <BsGraphUp />,
    },
    {
      label: 'Access Requests',
      href: `/admin/access-requests`,
      isActive: pathname.endsWith('/access-requests'),
      icon: <AiOutlineSend />,
    },
    {
      label: 'Users',
      href: `/admin/users`,
      isActive: pathname.endsWith('/users'),
      icon: <FiUsers />,
    },
    {
      label: 'Projects',
      href: `/admin/projects`,
      isActive: pathname.endsWith('/projects'),
      icon: <BsGrid />,
    },
    {
      label: 'Notes',
      href: `/admin/fieldnotes`,
      isActive: pathname.endsWith('/fieldnotes'),
      icon: <IoDocumentsOutline />,
    },
    {
      label: 'Files',
      href: `/admin/files`,
      isActive: pathname.endsWith('/files'),
      icon: <AiOutlineFileImage />,
    },
    {
      label: 'Send Email',
      href: `/admin/send-email`,
      isActive: pathname.endsWith('/send-email'),
      icon: <AiOutlineMail />,
    },
    {
      label: 'Settings',
      href: `/admin/settings`,
      isActive: pathname.endsWith('/settings'),
      icon: <AiOutlineSetting />,
    },
  ]
}
