import { FC } from 'react'
import {
  Stat as ChakraStat,
  Skeleton,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react'

type Props = {
  label: string
  value: number
  prevNumber?: number
  isLoading?: boolean
  formatter?: (value: number) => string
}

const Stat: FC<Props> = (p) => {
  const prevNumber = p.prevNumber ?? p.value
  const isIncreased = p.value > prevNumber
  const diff = p.value - prevNumber
  const isSame = p.value === prevNumber
  const formatter = p.formatter ?? ((value) => value.toString())

  return (
    <Skeleton isLoaded={!p.isLoading}>
      <ChakraStat>
        <StatLabel>{p.label}</StatLabel>
        <StatNumber>{formatter(p.value)}</StatNumber>
        {!p.prevNumber ? null : isSame ? (
          <StatHelpText>Same as last week</StatHelpText>
        ) : (
          <StatHelpText>
            <StatArrow type={isIncreased ? 'increase' : 'decrease'} />
            {formatter(diff)} {isIncreased ? 'more' : 'less'} since last week
          </StatHelpText>
        )}
      </ChakraStat>
    </Skeleton>
  )
}

export default Stat
