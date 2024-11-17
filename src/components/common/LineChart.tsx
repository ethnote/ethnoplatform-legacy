/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react'
import { Box, useColorModeValue } from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import ContainerDimensions from 'react-container-dimensions'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart as RechartLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useStyle } from 'hooks/useStyle'

type Props = {
  height?: number
  data?: {
    x: string
    y: number
    delta: number
  }[]
  valueKey: string
}

const LineChart: FC<Props> = (p) => {
  const { borderColor } = useStyle()
  const color = useColorModeValue(
    {
      cartesianGrid: '#e0e0e0',
      axis: '#000000',
      bg: '#ffffff',
      delta: '#909090',
    },
    {
      cartesianGrid: '#555555',
      axis: '#ffffff',
      bg: '#1E1F23',
      delta: '#EBF8FF',
    },
  )

  return (
    <Box mt={6}>
      <ContainerDimensions>
        {({ width }) => (
          <RechartLineChart
            height={p.height ?? 200}
            width={width}
            data={p.data}
          >
            <CartesianGrid stroke={color.cartesianGrid} />
            <XAxis
              interval={7}
              dataKey='x'
              stroke={color.axis}
              fontSize={12}
              reversed
            />
            <Tooltip
              contentStyle={{
                backgroundColor: color.bg,
                borderColor,
                borderRadius: BORDER_RADIUS,
              }}
              formatter={(value, nameType) => [
                `${nameType === 'delta' ? 'Delta' : p.valueKey}: ${value}`,
              ]}
            />

            {/* Delta */}
            <YAxis
              yAxisId='left'
              orientation='left'
              interval={1}
              stroke={color.axis}
              fontSize={12}
              domain={['auto', 'auto']}
            >
              <Label
                value='Delta'
                position='insideTopLeft'
                offset={14}
                style={{ transform: 'translate(-14px, 16px)' }}
              />
            </YAxis>
            <Line
              yAxisId='left'
              type='monotone'
              dataKey={'delta'}
              stroke={color.delta}
              strokeWidth={2}
              opacity={0.7}
              dot={false}
            />

            {/* Total */}
            <YAxis
              yAxisId='right'
              orientation='right'
              interval={1}
              stroke={color.axis}
              fontSize={12}
              domain={['auto', 'auto']}
            >
              <Label
                value='Total'
                position='insideTopLeft'
                offset={14}
                style={{ transform: 'translate(10px, 16px)' }}
              />
            </YAxis>
            <Line
              yAxisId='right'
              type='monotone'
              dataKey={'y'}
              stroke='#4299E1'
              strokeWidth={2}
              opacity={0.8}
              dot={false}
            />
          </RechartLineChart>
        )}
      </ContainerDimensions>
    </Box>
  )
}

export default LineChart
