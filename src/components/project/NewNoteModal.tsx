import { FC, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Box, useToast } from '@chakra-ui/react'
import {
  DATE_FORMAT_WITH_TIME,
  DEFAULT_TEMPLATE_NAME,
} from 'constants/constants'
import moment from 'moment'

import { api } from 'utils/api'
import { initials } from 'utils/initials'
import { noteNameTemplates } from 'utils/settingsUtils'
import { EasyForm, Modal, Walkthrough } from 'components'

type Props = {
  isOpen: boolean
  onClose: () => void
  projectHandle: string
  templateNames: string[]
}

type NewNote = {
  title: string
  templateName?: string
}

const NewNoteModal: FC<Props> = (p) => {
  const toast = useToast()
  const utils = api.useContext()
  const { push, query } = useRouter()

  const { data: me } = api.me.me.useQuery()

  const { data: project } = api.project.project.useQuery(
    {
      handle: query.projectHandle as string,
    },
    {
      enabled: !!query.projectHandle,
    },
  )

  const createNote = api.project.createNote.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while creating note',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess({ title }) {
      toast({
        title: `Successfully created note: ${title}`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      p.onClose()
    },
    onSettled() {
      utils.project.project.invalidate()
    },
  })

  const onSubmit = (
    value: Partial<NewNote>,
    nextStep: (projectHandle?: string, noteHandle?: string) => void,
  ) => {
    if (!value.title) return
    createNote.mutate(
      {
        projectHandle: p.projectHandle,
        title: value.title,
        templateName: value.templateName || DEFAULT_TEMPLATE_NAME,
      },
      {
        onSuccess: ({ handle }) => {
          handle && nextStep(undefined, handle)
        },
      },
    )
  }

  useEffect(() => {
    const handle = createNote.data?.handle
    if (handle) {
      push(`/projects/${p.projectHandle}/notes/${handle}`)
    }
  }, [createNote.data?.handle])

  const defaultNoteName = useMemo(
    () =>
      ({
        default1: `${moment().format('MMM D, YYYY')} - ${
          me?.fullName || 'Unknown'
        }`,
        default2: `${initials(me?.fullName || '') || '--'} - ${moment().format(
          'dddd HH:mm',
        )}`,
        default3: `${initials(me?.fullName || '') || '--'} - ${moment().format(
          'MMM D, YYYY HH:mm',
        )}`,
      })[project?.noteNameTemplate || 'default1'],
    [me, project, p.isOpen],
  )

  return (
    <Modal isOpen={p.isOpen} onClose={p.onClose} title='New Note' size='2xl'>
      <Box mb={4}>
        <Walkthrough stepKey='noteName'>
          {(nextStep) => (
            <EasyForm<NewNote>
              loading={createNote.isLoading}
              initialValues={{
                title: defaultNoteName,
                templateName: p.templateNames[0],
              }}
              config={{
                title: {
                  kind: 'input',
                  label: 'Note Name',
                },
                templateName: {
                  kind: 'select',
                  label: 'Template',
                  options: p.templateNames,
                  hidden: () => p.templateNames.length === 1,
                },
              }}
              submitButtonText={'Create Note'}
              onSubmit={(values) => {
                onSubmit(values, nextStep)
              }}
              onCancel={p.onClose}
            />
          )}
        </Walkthrough>
      </Box>
    </Modal>
  )
}

export default NewNoteModal
