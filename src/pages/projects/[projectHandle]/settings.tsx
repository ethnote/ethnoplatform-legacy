import { FC } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  GridItem,
  Heading,
  ResponsiveValue,
  Text,
  useToast,
} from '@chakra-ui/react'
import { AccessibilityLevel, TimeFormat } from '@prisma/client'
import { useSession } from 'next-auth/react'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { projectBreadcrumbs } from 'utils/projectBreadcrumbs'
import { noteNameTemplates } from 'utils/settingsUtils'
import { useProjectTabsItems } from 'hooks/useProjectTabsItems'
import {
  ContentBox,
  DangerZone,
  EditableDropdown,
  EditableText,
  PageDocument,
  ProjectMembers,
  SkeletonPlaceholder,
  TextEditorCustomHighlight,
} from 'components'

const ProjectSettings: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { query } = useRouter()
  const toast = useToast()
  const utils = api.useContext()

  const tabs = useProjectTabsItems()

  const { data: project, isLoading: projectIsLoading } =
    api.project.project.useQuery(
      {
        handle: query.projectHandle as string,
      },
      {
        enabled: !!query.projectHandle,
      },
    )
  const { data: me } = api.me.me.useQuery()

  const isOwner =
    project?.projectMemberships?.find(
      (membership) => membership.user?.id === me?.id,
    )?.projectRole === 'PROJECT_OWNER'

  const updateProject = api.project.updateProject.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while updating the project',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully updated the project`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      utils.project.project.invalidate()
      utils.me.me.invalidate()
    },
  })

  if (projectIsLoading) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <SkeletonPlaceholder withHeader w='1140px' />
      </AuthenticatedLayout>
    )
  }

  const breadcrumbItems = projectBreadcrumbs({
    projectName: project?.name,
    projectHandle: query.projectHandle as string,
  })

  const ValueWithLabel = ({
    label,
    children,
    colSpan = 1,
  }: {
    label: string
    children: React.ReactNode
    colSpan?: ResponsiveValue<number | 'auto'> | undefined
  }) => (
    <GridItem colSpan={colSpan}>
      <Box mb={2}>
        <Text fontSize='sm' opacity={0.5}>
          {label}
        </Text>
        {children}
      </Box>
    </GridItem>
  )

  const updateName = async (name: string | null | undefined) => {
    updateProject.mutate({
      projectHandle: query.projectHandle as string,
      name: name ?? undefined,
    })
  }

  const updateDescription = async (description: string | null | undefined) => {
    updateProject.mutate({
      projectHandle: query.projectHandle as string,
      description: description ?? undefined,
    })
  }

  const updateAccessibilityLevel = async (
    accessibilityLevel: string | null | undefined,
  ) => {
    updateProject.mutate({
      projectHandle: query.projectHandle as string,
      accessibilityLevel: accessibilityLevel || undefined,
    })
  }

  const updateTimeFormat = async (timeFormat: string | undefined) => {
    updateProject.mutate({
      projectHandle: query.projectHandle as string,
      timeFormat,
    })
  }

  const updateNoteNameTemplate = async (noteNameTemplate: string) => {
    updateProject.mutate({
      projectHandle: query.projectHandle as string,
      noteNameTemplate,
    })
  }

  return (
    <AuthenticatedLayout session={session} pageTitle={project?.name || ''}>
      <PageDocument
        header={'Settings'}
        breadcrumbs={breadcrumbItems.inProject}
        tabs={tabs}
      >
        <ContentBox title='General' minimizeId='generalSettigs' isMinimizable>
          <ValueWithLabel label='Project name'>
            <EditableText
              isEditable={isOwner}
              value={project?.name}
              onSave={updateName}
            />
          </ValueWithLabel>
          <ValueWithLabel label='Project description'>
            <EditableText
              isEditable={isOwner}
              value={project?.description}
              onSave={updateDescription}
              placeholder='Add a project description'
            />
          </ValueWithLabel>
          <ValueWithLabel label='Note access'>
            <EditableDropdown
              isEditable={isOwner}
              value={project?.accessibilityLevel}
              options={[
                {
                  label: 'All team members and team leaders',
                  value: AccessibilityLevel.ALL_MEMBERS_ALL_NOTES,
                },
                {
                  label: 'All team members and team leaders',
                  value: AccessibilityLevel.ONLY_NOTE_OWNER_AND_PROJECT_OWNER,
                },
                {
                  label: 'Only note owners until shared with the team',
                  value:
                    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL,
                },
                {
                  label: 'Only note owners until shared with team leaders',
                  value:
                    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER,
                },
              ]}
              onSave={updateAccessibilityLevel}
            />
          </ValueWithLabel>
          <ValueWithLabel label='Hour format'>
            <EditableDropdown
              isEditable={isOwner}
              value={project?.timeFormat}
              options={[
                {
                  label: '24H',
                  value: TimeFormat.TWENTY_FOUR_HOUR,
                },
                {
                  label: '12H',
                  value: TimeFormat.TWELVE_HOUR,
                },
              ]}
              onSave={(v) => updateTimeFormat(v as string)}
            />
          </ValueWithLabel>
          <ValueWithLabel label='Default note title'>
            <EditableDropdown
              isEditable={isOwner}
              value={
                ['default1', 'default2', 'default3'].includes(
                  project?.noteNameTemplate as string,
                )
                  ? project?.noteNameTemplate
                  : 'default1'
              }
              options={[
                {
                  label: noteNameTemplates.default1.label,
                  value: 'default1',
                },
                {
                  label: noteNameTemplates.default2.label,
                  value: 'default2',
                },
                {
                  label: noteNameTemplates.default3.label,
                  value: 'default3',
                },
              ]}
              onSave={(v) => updateNoteNameTemplate(v as string)}
            />
          </ValueWithLabel>
        </ContentBox>
        <ProjectMembers />
        <TextEditorCustomHighlight />
        <ContentBox>
          <Heading mb={4} fontSize={20} textAlign={'left'}>
            Danger Zone
          </Heading>
          <DangerZone />
        </ContentBox>
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default ProjectSettings
