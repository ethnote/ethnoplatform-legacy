import { FC, useEffect, useState } from 'react'
import { Box, Button, ButtonGroup, Flex } from '@chakra-ui/react'
import { Select } from 'chakra-react-select'

import { Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (projectId: string) => void
  options: { label: string; value: string }[]
}

const MovePersonalNoteToProject: FC<Props> = (p) => {
  const [seletedProjectId, setSelectedProjectId] = useState<string>()
  const selectedOption =
    p.options?.find((o) => o.value === seletedProjectId) || null

  useEffect(() => {
    p.isOpen && setSelectedProjectId(undefined)
  }, [p.isOpen])

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Move Quick Note To Project'
      size='2xl'
    >
      <Box my={12}>
        <Select
          colorScheme='purple'
          placeholder='Move quick note to project...'
          onChange={(value) => setSelectedProjectId(value?.value)}
          value={selectedOption}
          options={p.options}
        />
      </Box>
      <Flex justifyContent='flex-end'>
        <ButtonGroup mb={4}>
          <Button onClick={p.onClose}>Cancel</Button>
          <Button
            onClick={() => seletedProjectId && p.onConfirm(seletedProjectId)}
            isDisabled={!seletedProjectId}
          >
            Move
          </Button>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default MovePersonalNoteToProject
