import { FC, useState } from 'react'
import {
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Tag,
  Text,
  useColorMode,
} from '@chakra-ui/react'
import { createColumnHelper } from '@tanstack/react-table'
import { inferRouterOutputs } from '@trpc/server'
import { DATE_FORMAT_WITH_TIME } from 'constants/constants'
import moment from 'moment'
import ReactDiffViewer from 'react-diff-viewer'
import { AiOutlineEye } from 'react-icons/ai'
import { AppRouter } from 'server/api/root'
import { Descendant, Node } from 'slate'
import { textDiffStyles } from 'styles/textDiffStyle'

import { EasyTableOld, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  history?: inferRouterOutputs<AppRouter>['note']['getNoteFieldHistory']
}

type NoteFieldHistory =
  inferRouterOutputs<AppRouter>['note']['getNoteFieldHistory'][number]

const TextEditorHistoryModal: FC<Props> = (p) => {
  const [versionToView, setVersionToView] = useState<NoteFieldHistory | null>()
  const { colorMode } = useColorMode()

  const columnHelper = createColumnHelper<NoteFieldHistory>()

  const columns = [
    columnHelper.accessor('author', {
      cell: (info) => info.getValue()?.fullName,
      header: 'Author',
    }),
    columnHelper.accessor('content', {
      cell: (info) => {
        const lineDiff =
          serialize(info.row.original.content as unknown as Descendant[])
            .split('\n')
            .filter((x) => x !== '').length -
          serialize(info.row.original.prevContent as unknown as Descendant[])
            .split('\n')
            .filter((x) => x !== '').length

        if (lineDiff === 0) {
          return <></>
        }

        return (
          <Tag colorScheme={lineDiff > 0 ? 'green' : 'red'}>{lineDiff}</Tag>
        )
      },
      header: 'Lines added',
    }),
    columnHelper.accessor('createdAt', {
      cell: (info) => (
        <Flex justifyContent='space-between' alignItems='center'>
          <Flex>
            {moment(info.getValue()).format(DATE_FORMAT_WITH_TIME)}
            {info.row.original.isLatest && (
              <Text ml={2} opacity={0.5}>
                (current)
              </Text>
            )}
          </Flex>
          <ButtonGroup variant='ghost'>
            <IconButton
              onClick={() =>
                setVersionToView(info.row.original as NoteFieldHistory)
              }
              icon={<AiOutlineEye />}
              aria-label={'View'}
            />
            {/* <Button leftIcon={<MdRestore />}>Restore</Button> */}
          </ButtonGroup>
        </Flex>
      ),
      header: 'Changes made at',
    }),
  ]

  const serialize = (nodes: Descendant[]) => {
    return nodes?.map((n) => Node.string(n)).join('\n')
  }

  const newValue = serialize(versionToView?.content as unknown as Descendant[])
  const oldValue = serialize(
    versionToView?.prevContent as unknown as Descendant[],
  )

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Revision History'
      size='4xl'
      closeButton
    >
      <Box mb={2}>
        {p.history ? (
          <EasyTableOld columns={columns} data={p.history} />
        ) : (
          <Text>No history</Text>
        )}
      </Box>
      <Modal
        isOpen={!!versionToView}
        onClose={() => setVersionToView(null)}
        title={moment(versionToView?.createdAt).format(DATE_FORMAT_WITH_TIME)}
        size='6xl'
        closeButton
      >
        {versionToView?.content ? (
          <Box my={4} fontSize='sm' color='gray.900'>
            <ReactDiffViewer
              oldValue={oldValue as string}
              newValue={newValue as string}
              splitView={true}
              useDarkTheme={colorMode === 'dark'}
              styles={textDiffStyles}
            />
          </Box>
        ) : (
          <></>
        )}
      </Modal>
    </Modal>
  )
}

export default TextEditorHistoryModal
