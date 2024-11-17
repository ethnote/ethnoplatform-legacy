import { useRouter } from 'next/router'
import { AiOutlineSetting } from 'react-icons/ai'
import { BiNote } from 'react-icons/bi'
import { CiGrid2H } from 'react-icons/ci'

export const useProjectTabsItems = () => {
  const { pathname, query } = useRouter()
  return [
    {
      label: 'Notes',
      href: `/projects/${query.projectHandle}/notes`,
      isActive: pathname.endsWith('/notes'),
      icon: <BiNote />,
      walkthroughStepKey: 'notes',
    },
    // {
    //   label: 'Attachments',
    //   href: `/projects/${query.projectHandle}/files`,
    //   isActive: pathname.endsWith('/files'),
    //   icon: <AiOutlineFileImage />,
    // },
    // {
    //   label: 'Hashtags',
    //   href: `/projects/${query.projectHandle}/hashtags`,
    //   isActive: pathname.endsWith('/hashtags'),
    //   icon: <HiOutlineHashtag />,
    // },
    // {
    //   label: 'Map',
    //   href: `/projects/${query.projectHandle}/map`,
    //   isActive: pathname.endsWith('/map'),
    //   icon: <FiMapPin />,
    // },
    {
      label: 'Note templates',
      href: `/projects/${query.projectHandle}/template`,
      isActive: pathname.endsWith('/template'),
      icon: <CiGrid2H />,
    },
    {
      label: 'Settings',
      href: `/projects/${query.projectHandle}/settings`,
      isActive: pathname.endsWith('/settings'),
      icon: <AiOutlineSetting />,
    },
  ]
}
