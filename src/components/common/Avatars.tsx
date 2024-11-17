import { FC } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import { useStyle } from 'hooks/useStyle'
import { Avatar } from 'components'

type Props = {
  data: {
    image?: string
    name?: string
    avatarHue?: number
  }[]
  shouldExpand?: boolean
}

const Avatars: FC<Props> = (p) => {
  const { bg } = useStyle()
  if (!p.data.length) return null

  return (
    <Flex position='absolute' left={3} bottom={3}>
      {p.data.slice(0, 3).map((d, i) => {
        const ml = i === 0 ? 0 : p.shouldExpand ? -1 : -2

        return (
          <Box
            key={i}
            transition={'.3s'}
            ml={ml}
            borderRadius='full'
            boxShadow={`-1px 0 2px 1px #${bg}70`}
          >
            <Avatar src={d.image} name={d.name} size='sm' hue={d.avatarHue} />
          </Box>
        )
      })}
      {p.data.length > 3 && (
        <Box
          transition={'.3s'}
          ml={p.shouldExpand ? -1 : -2}
          borderRadius='full'
          boxShadow={`-1px 0 2px 1px #${bg}70`}
        >
          <Avatar textOverride={`+${p.data.length - 3}`} size='sm' noColor />
        </Box>
      )}
    </Flex>
  )
}

export default Avatars
