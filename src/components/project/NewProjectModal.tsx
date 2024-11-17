import { FC, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Box, useToast } from '@chakra-ui/react'
import { AccessibilityLevel } from '@prisma/client'
import * as Yup from 'yup'

import { api } from 'utils/api'
import { EasyForm, Modal, Walkthrough } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
}

type NewProject = {
  name: string
  description?: string
  accessibilityLevel: AccessibilityLevel
  memberEmails?: string[]
}

const NewProjectModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const { push } = useRouter()

  const createProject = api.project.createProject.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while creating project',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess({ name }) {
      toast({
        title: `Successfully created project: ${name}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.me.me.invalidate()
    },
  })

  const onSubmit = (
    value: Partial<NewProject>,
    nextStep: (projectHandle?: string, noteHandle?: string) => void,
  ) => {
    if (!value.name) return
    createProject.mutate(
      {
        name: value.name,
        description: value.description,
        accessibilityLevel: value.accessibilityLevel,
        invitedUserEmails: value.memberEmails,
      },
      {
        onSuccess({ handle }) {
          handle && nextStep(handle)
        },
      },
    )
  }

  useEffect(() => {
    const handle = createProject.data?.handle
    if (handle) {
      push(`/projects/${handle}/template`)
    }
  }, [createProject.data?.handle])

  return (
    <Modal isOpen={p.isOpen} onClose={p.onClose} title='New Project' size='2xl'>
      <Box mb={4}>
        <Walkthrough stepKey='nameProject'>
          {(nextStep) => (
            <EasyForm<NewProject>
              loading={createProject.isLoading}
              initialValues={{
                accessibilityLevel: AccessibilityLevel.ALL_MEMBERS_ALL_NOTES,
              }}
              config={{
                name: {
                  kind: 'input',
                  label: 'Project Name',
                },
                description: {
                  kind: 'textarea',
                  label: 'Project Description',
                  optional: true,
                },
                accessibilityLevel: {
                  kind: 'select',
                  description: 'Who can see the notes in this project?',
                  optionLabels: [
                    'All team members and team leaders',
                    'Only note owners and team leaders',
                    'Only note owners until shared with the team',
                    'Only note owners until shared with team leaders',
                  ],
                  options: [
                    AccessibilityLevel.ALL_MEMBERS_ALL_NOTES,
                    AccessibilityLevel.ONLY_NOTE_OWNER_AND_PROJECT_OWNER,
                    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL,
                    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER,
                  ],
                },
                memberEmails: {
                  kind: 'creatable_select_multi',
                  label: 'Invite team members',
                  description: 'Enter email addresses of new team members.',
                  options: [],
                  optional: true,
                  placeholder: 'Enter email addresses',
                },
              }}
              yupSchema={{
                memberEmails: Yup.array(Yup.string().email('Invalid email')),
              }}
              submitButtonText={'Create Project'}
              onSubmit={(values) => onSubmit(values, nextStep)}
              onCancel={p.onClose}
            />
          )}
        </Walkthrough>
      </Box>
    </Modal>
  )
}

export default NewProjectModal
