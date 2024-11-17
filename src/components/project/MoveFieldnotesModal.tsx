import { FC, useEffect, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Text,
  useToast,
} from '@chakra-ui/react'
import { ProjectRole } from '@prisma/client'
import { Select } from 'chakra-react-select'
import { BORDER_RADIUS } from 'constants/constants'
import { reverse } from 'lodash'
import { utils } from 'xlsx'

import { api } from 'utils/api'
import { Modal } from 'components'

type Props = {
  type: 'copy' | 'move' | null
  onClose: () => void
  currentProjectId: string | undefined
  selectedNotes: string[]
  setSelectedNotes: (notes: string[]) => void
}

const MoveFieldnotesModal: FC<Props> = (p) => {
  const [seletedProjectId, setSelectedProjectId] = useState<string>()
  const utils = api.useContext()
  const toast = useToast()

  const { data: me } = api.me.me.useQuery()

  const moveFieldnotes = api.project.moveFieldnotes.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: `Notes ${
          p.type === 'move' ? 'moved' : 'copied'
        } successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      p.setSelectedNotes([])
      utils.project.project.invalidate()
      p.onClose()
    },
    onError: (e) => {
      console.error(e)
      toast({
        title: 'Error!',
        description: 'Something went wrong.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  const projects = p.currentProjectId
    ? me?.projectMemberships
        .filter((pm) => pm.projectRole === ProjectRole.PROJECT_OWNER)
        .map((pm) => ({
          value: pm.project?.id,
          label: pm.project?.name,
        }))
        .filter((a) => a.value !== p.currentProjectId)
    : []

  const selectedOption =
    projects?.find((o) => o.value === seletedProjectId) || null

  useEffect(() => {
    p.type && setSelectedProjectId(undefined)
  }, [p.type])

  const onClick = () => {
    if (!seletedProjectId || !p.type || !p.currentProjectId) return
    moveFieldnotes.mutateAsync({
      fromProjectId: p.currentProjectId,
      toProjectId: seletedProjectId,
      noteIds: p.selectedNotes,
      type: p.type,
    })
  }

  return (
    <Modal
      isOpen={!!p.type}
      onClose={p.onClose}
      title={`${p.type === 'move' ? 'Move' : 'Copy'} Notes To Another Project`}
      size='2xl'
    >
      <Text opacity={0.5}>
        {p.type === 'copy'
          ? 'When the fieldnotes are copied, they will still be available in this project.'
          : 'When fieldnotes are moved, they will be deleted from this project.'}{' '}
        Comments and notifications will not be{' '}
        {p.type === 'copy' ? 'copied' : 'moved'}.
      </Text>
      <Box mt={8}>
        <Select
          colorScheme='purple'
          placeholder={`${
            p.type === 'move' ? 'Move' : 'Copy'
          } fieldnotes to...`}
          selectedOptionStyle='check'
          chakraStyles={{
            control: (provided) => ({
              ...provided,
              borderRadius: BORDER_RADIUS,
            }),
            menuList: (provided) => ({
              ...provided,
              borderRadius: BORDER_RADIUS,
            }),
          }}
          onChange={(value) => setSelectedProjectId(value?.value)}
          value={selectedOption}
          options={reverse([...(projects || [])])}
        />
      </Box>
      <Flex justifyContent='flex-end'>
        <ButtonGroup mb={4} mt={8}>
          <Button onClick={p.onClose}>Cancel</Button>
          <Button
            isLoading={moveFieldnotes.isLoading}
            onClick={onClick}
            isDisabled={!seletedProjectId}
          >
            {p.type === 'move' ? 'Move' : 'Copy'} {p.selectedNotes.length}{' '}
            fieldnote{p.selectedNotes.length > 1 ? 's' : ''}
          </Button>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default MoveFieldnotesModal
