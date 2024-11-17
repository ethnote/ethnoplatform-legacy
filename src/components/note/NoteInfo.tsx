import { FC, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Box, Button, Flex, Grid, GridItem, Text } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { capitalize } from 'lodash'
import moment from 'moment'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { useStyle } from 'hooks/useStyle'
import {
  Avatar,
  EditableDropdown,
  EditableText,
  InformationBadge,
  SyncTemplateModal,
} from 'components'

type NoteInfoItemProps = {
  label: string
  value: JSX.Element
}

const NoteInfoItem: FC<NoteInfoItemProps> = ({ label, value }) => {
  return (
    <GridItem>
      <Text fontSize='sm' opacity={0.5}>
        {label}
      </Text>
      <Text mb={4}>{value}</Text>
    </GridItem>
  )
}

type Props = {
  onUpdateNoteTitle: (title: string | undefined | null) => void
  canEdit: boolean
  note: inferRouterOutputs<AppRouter>['note']['note']
}

const NoteInfo: FC<Props> = (p) => {
  const { query } = useRouter()
  const utils = api.useContext()
  const { interactiveColor } = useStyle()
  const [syncTemplateModalIsOpen, setSyncTemplateModalIsOpen] = useState(false)

  const { data: project } = api.project.project.useQuery({
    handle: query.projectHandle as string,
  })

  const updateNoteAuthor = api.note.updateNoteAuthor.useMutation({
    onSettled() {
      utils.note.note.invalidate()
      utils.project.project.invalidate()
    },
  })

  const members = project?.projectMemberships
    ?.map((m) => {
      return {
        userId: m.user?.id,
        name: m.user?.fullName,
        email: m.user?.email || m.invitationMailSentTo,
        avatarHue: m.user?.avatarHue,
        invitationAcceptedAt: m.invitationAcceptedAt,
      }
    })
    .filter((m) => m.invitationAcceptedAt)

  const author = useMemo(
    () => members?.find((m) => m.userId === p.note?.author?.id),
    [p.note?.author?.id, project],
  )

  const onAuthorChange = (authorId: string) => {
    if (!p.note?.id) return
    updateNoteAuthor.mutate({
      id: p.note?.id,
      newAuthorId: authorId,
    })
  }

  const items = [
    {
      label: 'Author',
      value: (
        <Flex alignItems='center' gap={2} mt={1}>
          <Avatar name={author?.name} hue={author?.avatarHue} size='sm' />
          <EditableDropdown
            isEditable={p.canEdit}
            value={p.note?.author?.id}
            options={
              (members?.map((m) => ({
                value: m.userId,
                label: m.name,
                icon: <Avatar name={m.name} hue={m.avatarHue} size='xs' />,
              })) || []) as {
                value: string
                label: string
              }[]
            }
            onSave={(id) => id && onAuthorChange(id)}
          />
        </Flex>
      ),
    },
    p.note?.title && {
      label: 'Note Name',
      value: (
        <EditableText
          isEditable={p.canEdit}
          value={p.note?.title}
          onSave={p.onUpdateNoteTitle}
        />
      ),
    },
    typeof p.note?.templateVersion === 'number' && {
      label: 'Template Version',
      value: (
        <Flex>
          <Text>
            {p.note?.templateVersion}
            {p.note?.templateName ? ` - ${p.note?.templateName}` : ''}
          </Text>
          <Button
            aria-label='Edit'
            size='sm'
            fontWeight='bold'
            variant='link'
            color={interactiveColor}
            margin={0}
            ml={2}
            onClick={() => setSyncTemplateModalIsOpen(true)}
          >
            Sync
          </Button>
          <Box ml={1}>
            <InformationBadge
              thin
              tip='Add fields from the latest template version to this note.'
            />
          </Box>
        </Flex>
      ),
    },
    p.note?.project?.name && {
      label: 'Project Name',
      value: <Text>{p.note?.project?.name}</Text>,
    },
    p.note?.createdAt && {
      label: 'Created',
      value: (
        <Text>{moment(p.note?.createdAt).format('MMMM Do YYYY, HH:mm')}</Text>
      ),
    },
    p.note?.updatedAt && {
      label: 'Last Updated',
      value: <Text>{capitalize(moment(p.note?.updatedAt).fromNow())}</Text>,
    },
    p.note?.project?.description && {
      label: 'Project Description',
      value: <Text>{p.note?.project?.description}</Text>,
    },
  ].filter(Boolean) as NoteInfoItemProps[]

  return (
    <Box>
      <Grid
        gridTemplate={{
          base: 'repeat(2, 1fr) / repeat(1, 1fr)',
          md: 'repeat(2, 1fr) / repeat(2, 1fr)',
          lg: 'repeat(2, 1fr) / repeat(3, 1fr)',
        }}
        gap={2}
      >
        {items.map((i, index) => (
          <NoteInfoItem key={index} label={i.label} value={i.value} />
        ))}
      </Grid>
      <SyncTemplateModal
        isOpen={syncTemplateModalIsOpen}
        onClose={() => setSyncTemplateModalIsOpen(false)}
        note={p.note}
      />
    </Box>
  )
}

export default NoteInfo
