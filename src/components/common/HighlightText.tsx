import { Highlight } from '@chakra-ui/react'

const HighlightText = ({
  children,
  searchWord,
}: {
  children: any
  searchWord?: string
}) => (
  <Highlight query={searchWord || ''} styles={{ bg: 'orange.100' }}>
    {children}
  </Highlight>
)

export default HighlightText
