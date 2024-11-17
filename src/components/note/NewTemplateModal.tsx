import { FC } from 'react'
import { Box } from '@chakra-ui/react'

import { EasyForm, Modal } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
}

type NewTemplate = {
  title: string
}

const NewTemplateModal: FC<Props> = (p) => {
  const onSubmit = (value: Partial<NewTemplate>) => {
    if (!value.title) return
    p.onSave(value.title)
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='New Template'
      size='2xl'
    >
      <Box mb={4}>
        <EasyForm<NewTemplate>
          loading={false}
          config={{
            title: {
              kind: 'input',
              label: 'Name',
            },
          }}
          submitButtonText={'Create Template'}
          onSubmit={onSubmit}
          onCancel={p.onClose}
        />
      </Box>
    </Modal>
  )
}

export default NewTemplateModal
