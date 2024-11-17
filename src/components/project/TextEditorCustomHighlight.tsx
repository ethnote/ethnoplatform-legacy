import { FC } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Divider,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tag,
  Text,
} from '@chakra-ui/react'
import { DEFAULT_TEXT_EDITOR_HIGHLIGHT } from 'constants/constants'
import { useSession } from 'next-auth/react'
import { AiOutlineEdit, AiOutlinePlus } from 'react-icons/ai'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { api } from 'utils/api'
import { useConfirm } from 'hooks/useConfirm'
import { useCreateUpdate } from 'hooks/useCreateUpdate'
import { ButtonVariant } from 'components'
import ContentBox from 'components/common/ContentBox'

type Props = {
  param?: string
}

type CreateHighlight = {
  name: string
  color: string
  symbol: string
}

export type Highlight = {
  id: string
  name: string
  color: string
  symbol: string
}

const colors = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'cyan',
  'purple',
  'pink',
]

const TextEditorCustomHighlight: FC<Props> = () => {
  const utils = api.useContext()
  const { confirm } = useConfirm()
  const { query } = useRouter()
  const { data: session } = useSession()
  const updateTextEditorHighlights =
    api.project.updateTextEditorHighlights.useMutation()

  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
    },
  )

  const highlights = (
    project?.textEditorHighlights?.length
      ? project?.textEditorHighlights
      : DEFAULT_TEXT_EDITOR_HIGHLIGHT
  ) as Highlight[]

  const isOwner =
    project?.projectMemberships?.find(
      (membership) => membership.user?.id === session?.user.id,
    )?.projectRole === 'PROJECT_OWNER'

  const { open: openCreateHighlight } = useCreateUpdate<CreateHighlight>({
    type: 'create',
    formConfig: {
      name: {
        label: 'Name',
        kind: 'input',
      },
      color: {
        label: 'Color',
        kind: 'select',
        options: colors,
      },
      symbol: {
        label: 'Symbol',
        kind: 'input',
      },
    },
    entityName: 'Annotation',
    mutation: ({ name, color, symbol }) =>
      new Promise(async (resolve, reject) => {
        try {
          const textEditorHighlights = [
            ...highlights,
            { id: Math.random().toString(), name, color, symbol },
          ] as Highlight[]
          project?.handle &&
            (await updateTextEditorHighlights.mutateAsync({
              projectHandle: project.handle,
              textEditorHighlights,
            }))
          resolve(name)
        } catch (error) {
          reject()
        }
      }),
    onSuccess: async () => {
      await utils.project.project.invalidate()
    },
  })

  const { open: openUpdateHighlight } = useCreateUpdate<Highlight>({
    type: 'update',
    formConfig: {
      name: {
        label: 'Name',
        kind: 'input',
      },
      color: {
        label: 'Color',
        kind: 'select',
        options: colors,
      },
      symbol: {
        label: 'Symbol',
        kind: 'input',
      },
    },
    entityName: 'Annotation',
    mutation: ({ id, name, color, symbol }) =>
      new Promise(async (resolve, reject) => {
        try {
          const textEditorHighlights = [
            ...highlights.filter((h) => h.id !== id),
            { id, name, color, symbol },
          ] as Highlight[]
          project?.handle &&
            (await updateTextEditorHighlights.mutateAsync({
              projectHandle: project.handle,
              textEditorHighlights,
            }))
          resolve(name)
        } catch (error) {
          reject()
        }
      }),
    onSuccess: async () => {
      await utils.project.project.invalidate()
    },
  })

  const onDeleteClicked = async (id: string) => {
    confirm({
      title: 'Delete annotation',
      message: 'Are you sure you want to delete this annotation?',
      isDanger: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        const textEditorHighlights = highlights.filter((h) => h.id !== id)
        project?.handle &&
          (await updateTextEditorHighlights.mutateAsync({
            projectHandle: project.handle,
            textEditorHighlights,
          }))
        await utils.project.project.invalidate()
      },
    })
  }

  return (
    <ContentBox
      minimizeId='settings-highlight'
      title='Annotations'
      isMinimizable
    >
      <Flex>
        {isOwner && (
          <ButtonVariant
            size='sm'
            leftIcon={<AiOutlinePlus />}
            variant='outline'
            colorScheme='blue'
            onClick={() => openCreateHighlight()}
          >
            Create annotation
          </ButtonVariant>
        )}
      </Flex>
      <Box mt={6}>
        {highlights.map((_h, i) => {
          const isLast = i === highlights.length - 1
          const h = _h as Highlight

          return (
            <Box key={i}>
              <Flex key={h.id} justifyContent='space-between'>
                <Flex gap={2} alignItems='center'>
                  <Text>
                    <b>{h.name}:</b>
                  </Text>
                  <Tag colorScheme={h.color}>
                    {h.symbol}
                    {h.symbol === '"' ? '' : ' '}
                    annotation in {h.color}
                    {h.symbol === '"' ? '' : ' '}
                    {h.symbol}
                  </Tag>{' '}
                </Flex>
                {isOwner && (
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label={''}
                      variant='ghost'
                      ml={2}
                      icon={<BsThreeDotsVertical />}
                    />
                    <Portal>
                      <MenuList>
                        <MenuItem
                          icon={<AiOutlineEdit />}
                          onClick={() => openUpdateHighlight(h)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<BsTrash />}
                          onClick={() => onDeleteClicked(h.id)}
                        >
                          Remove
                        </MenuItem>
                      </MenuList>
                    </Portal>
                  </Menu>
                )}
              </Flex>
              {!isLast && (
                <Flex>
                  <Divider my={3} />
                </Flex>
              )}
            </Box>
          )
        })}
      </Box>
    </ContentBox>
  )
}

export default TextEditorCustomHighlight
