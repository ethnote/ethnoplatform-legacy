import { FC, useState } from 'react'
import { Link, chakra } from '@chakra-ui/react'

type Props = {
  text: string
  charCutoff?: number
  link?: string
}

const ExpandableText: FC<Props> = (p) => {
  const [showMore, setShowMore] = useState(false)

  const charCutoff = p.charCutoff || 200

  const isTruncated = (p.text?.length || 0) > charCutoff
  const description = isTruncated
    ? showMore
      ? (p.text || '') + ' ' || ''
      : `${(p.text || '').slice(0, charCutoff)}... `
    : p.text || ''
  const lines = description.split('\n')

  return (
    <>
      <Link href={p.link}>
        <chakra.span>
          {lines.map((l, i) => (
            <chakra.span key={i} opacity={0.8}>
              {l}
              {i !== lines.length - 1 && <br />}
            </chakra.span>
          ))}
        </chakra.span>
      </Link>
      {isTruncated && (
        <chakra.span
          fontWeight='bold'
          cursor='pointer'
          _hover={{ textDecoration: 'underline' }}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? 'show less' : 'show more'}
        </chakra.span>
      )}
    </>
  )
}

export default ExpandableText
