import { FC } from 'react'
import {
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/react'
import { HiOutlineInformationCircle } from 'react-icons/hi'

type Props = {
  tip: string
  thin?: boolean
}

const InformationBadge: FC<Props> = (p) => {
  return (
    <Popover>
      <PopoverTrigger>
        <IconButton
          p={p.thin ? 0 : undefined}
          maxH={p.thin ? 5 : undefined}
          maxW={p.thin ? 5 : undefined}
          icon={<HiOutlineInformationCircle opacity={0.8} />}
          aria-label={p.tip}
          variant='unstyled'
        />
      </PopoverTrigger>
      <PopoverContent mx={2}>
        <PopoverBody>{p.tip}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default InformationBadge
