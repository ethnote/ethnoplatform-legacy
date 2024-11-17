import { FC, useEffect, useState } from 'react'
import { Box, Button, ButtonGroup, Flex } from '@chakra-ui/react'
import { Select } from 'chakra-react-select'
import { BORDER_RADIUS } from 'constants/constants'
import { Template } from 'types/template'

import { Modal, SelectExistingTemplate } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  onReplaceClick: (projectId: string, selectedTemplateNames: string[]) => void
  onAppendClick: (projectId: string, selectedTemplateNames: string[]) => void
  options: { label: string; value: string; template: Template }[]
}

const CopyTemplateFromProjectModal: FC<Props> = (p) => {
  const [seletedProjectId, setSelectedProjectId] = useState<string>()
  const [selectedTemplateNames, setSelectedTemplateNames] = useState<string[]>(
    [],
  )
  const selectedOption =
    p.options?.find((o) => o.value === seletedProjectId) || null

  useEffect(() => {
    p.isOpen && setSelectedProjectId(undefined)
  }, [p.isOpen])

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Import Template'
      size='2xl'
    >
      <Box mt={12}>
        <Select
          colorScheme='purple'
          placeholder='Import template from...'
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
          options={p.options}
        />
      </Box>
      <SelectExistingTemplate
        template={selectedOption?.template}
        selectedTemplateNames={selectedTemplateNames}
        setSelectedTemplateNames={setSelectedTemplateNames}
      />
      <Flex justifyContent='flex-end'>
        <ButtonGroup mb={4}>
          <Button onClick={p.onClose}>Cancel</Button>
          <Button
            onClick={() =>
              seletedProjectId &&
              p.onReplaceClick(seletedProjectId, selectedTemplateNames)
            }
            isDisabled={!seletedProjectId || !selectedTemplateNames.length}
          >
            Replace
          </Button>
          <Button
            onClick={() =>
              seletedProjectId &&
              p.onAppendClick(seletedProjectId, selectedTemplateNames)
            }
            isDisabled={!seletedProjectId || !selectedTemplateNames.length}
          >
            Append
          </Button>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default CopyTemplateFromProjectModal
