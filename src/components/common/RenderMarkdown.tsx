import { FC } from 'react'
import {
  Divider,
  Heading,
  Image,
  OrderedList,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from '@chakra-ui/react'
import { BORDER_RADIUS } from 'constants/constants'
import Markdown from 'markdown-to-jsx'

import { useStyle } from 'hooks/useStyle'

type Props = {
  children: string
}

const RenderMarkdown: FC<Props> = (p) => {
  const { interactive, bgSemiTransparent } = useStyle()

  const options = {
    overrides: {
      h1: {
        component: Heading,
        props: {
          fontSize: 32,
          mt: 8,
          mb: 4,
        },
      },
      h2: {
        component: Heading,
        props: {
          fontSize: 24,
          mt: 8,
          mb: 4,
        },
      },
      h3: {
        component: Heading,
        props: {
          fontSize: 16,
          mt: 6,
          mb: -1,
          opacity: 0.5,
          fontFamily: 'Outfit Regular',
          fontWeight: 'normal',
        },
      },
      table: {
        component: Table,
        props: {
          mt: 4,
          mb: 8,
        },
      },
      thead: {
        component: Thead,
      },
      tbody: {
        component: Tbody,
      },
      tfoot: {
        component: Tfoot,
      },
      tr: {
        component: Tr,
      },
      th: {
        component: Th,
        props: {
          py: 4,
          px: 2,
        },
      },
      td: {
        component: Td,
        props: {
          py: 4,
          px: 2,
        },
      },
      tableCaption: {
        component: TableCaption,
      },
      tableContainer: {
        component: TableContainer,
      },
      img: {
        component: Image,
        props: {
          borderRadius: BORDER_RADIUS,
          w: '100%',
        },
      },
      p: {
        component: Text,
        props: {
          mt: 4,
          mb: 4,
        },
      },
      a: {
        component: Text,
        props: {
          color: interactive,
          as: 'a',
          fontWeight: 'bold',
        },
      },
      hr: {
        component: Divider,
      },
      ul: {
        component: UnorderedList,
        props: {
          mt: -2,
          mb: 4,
        },
      },
      ol: {
        component: OrderedList,
        props: {
          mt: -2,
          mb: 4,
        },
      },
      pre: {
        component: Text,
        props: {
          as: 'pre',
          bg: bgSemiTransparent,
          borderRadius: BORDER_RADIUS,
          p: 4,
          overflowX: 'auto',
          fontFamily: 'mono',
          fontSize: 'sm',
          whiteSpace: 'pre-wrap',
        },
      },
    },
  }

  return <Markdown options={options}>{p.children}</Markdown>
}

export default RenderMarkdown
