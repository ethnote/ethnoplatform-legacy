import { FC } from 'react'
import { Text, TextProps } from '@chakra-ui/react'

import { useStyle } from 'hooks/useStyle'

type Props = {
  children: string
}

const InteractiveText: FC<Props & TextProps> = (p) => {
  const { interactiveColor } = useStyle()

  return (
    <Text
      {...p}
      cursor='pointer'
      fontWeight='bold'
      opacity={0.5}
      _hover={{
        opacity: 1,
        color: interactiveColor,
      }}
      _active={{
        color: interactiveColor,
        opacity: 0.7,
      }}
    >
      {p.children}
    </Text>
  )
}

export default InteractiveText
