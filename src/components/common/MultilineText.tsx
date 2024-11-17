import { FC } from 'react'
import { Text, TextProps } from '@chakra-ui/react'

type Props = {
  children: string
}

const MultilineText: FC<Props & TextProps> = (p) => {
  return (
    <Text {...p}>
      {p.children.split('\n').map((item, key) => {
        return (
          <span key={key}>
            {item}
            <br />
          </span>
        )
      })}
    </Text>
  )
}

export default MultilineText
