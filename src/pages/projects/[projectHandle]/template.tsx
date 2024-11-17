import { FC, useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  IconButton,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import moment from 'moment'
import { nanoid } from 'nanoid'
import { useSession } from 'next-auth/react'
import { AiOutlineSave } from 'react-icons/ai'
import { BiRedo, BiUndo } from 'react-icons/bi'
import { MdCopyAll, MdHistory } from 'react-icons/md'
import { MetadataField, Template } from 'types/template'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { projectBreadcrumbs } from 'utils/projectBreadcrumbs'
import { useConfirm } from 'hooks/useConfirm'
import { useGlobalState } from 'hooks/useGlobalState'
import { useLeavePageConfirm } from 'hooks/useLeavePageConfirm'
import { useProjectTabsItems } from 'hooks/useProjectTabsItems'
import {
  ButtonVariant,
  Confirm,
  ContentBox,
  CopyTemplateFromProjectModal,
  EditableText,
  InformationBadge,
  LockedByModal,
  NewTemplateModal,
  PageDocument,
  SkeletonPlaceholder,
  TemplateBlockTable,
  TemplateHistoryModal,
  Walkthrough,
} from 'components'

const ProjectTemplate: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { query } = useRouter()
  const tabs = useProjectTabsItems()
  const utils = api.useContext()
  const toast = useToast()
  const { isSmallScreen, templateLockId } = useGlobalState()
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  // Lock
  const [lockModalIsOpen, setLockModalIsOpen] = useState(false)
  const [isTakingOverSession, setIsTakingOverSession] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [lockChecked, setLockChecked] = useState(false)

  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([])
  const [noteFields, setNoteFields] = useState<MetadataField[]>([])

  const [fieldBeingEdited, setFieldBeingEdited] = useState<string | null>(null)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)

  const { confirm } = useConfirm()

  const [newTemplateVariantModalOpen, setNewTemplateVariantModalOpen] =
    useState(false)

  const [
    copyTemplateFromProjectModalOpen,
    setCopyTemplateFromProjectModalOpen,
  ] = useState(false)

  const { data: project, isLoading: projectIsLoading } =
    api.project.project.useQuery(
      {
        handle: query.projectHandle as string,
      },
      {
        enabled: !!query.projectHandle,
        refetchOnWindowFocus: false,
      },
    )

  const { data: me } = api.me.me.useQuery()

  const takeOverTemplateSession =
    api.project.takeOverTemplateSession.useMutation()

  useEffect(() => {
    setIsTakingOverSession(false)
    setIsReadOnly(false)
  }, [project?.id])

  useEffect(() => {
    if (
      !project?.id ||
      isTakingOverSession ||
      isReadOnly ||
      !isOwner ||
      lockChecked
    )
      return
    const isLocked = moment(project?.templateLockedAt)
      .add(10, 'minutes')
      .isAfter(moment())

    const isSameLockId = project?.templateLockId === templateLockId

    if (isLocked && !isSameLockId) {
      setLockModalIsOpen(true)
    } else {
      onTakeOverClick()
    }
    setLockChecked(true)
  }, [project?.templateLockedAt])

  const onTakeOverClick = () => {
    if (!project?.id) return
    takeOverTemplateSession.mutate(
      {
        id: project?.id,
        templateLockId,
      },
      {
        onSettled() {
          utils.project.project.invalidate()
        },
      },
    )
    setIsReadOnly(false)
    setIsTakingOverSession(true)
    setLockModalIsOpen(false)
  }

  const [undoStack, setUndoStack] = useState<
    {
      metadataFields: MetadataField[]
      noteFields: MetadataField[]
    }[]
  >([])
  const canUndo = undoStack.length > 1
  const [redoStack, setRedoStack] = useState<
    {
      metadataFields: MetadataField[]
      noteFields: MetadataField[]
    }[]
  >([])
  const canRedo = redoStack.length > 0

  const updateStacks = ({
    metadataFields,
    noteFields,
  }: {
    metadataFields: MetadataField[]
    noteFields: MetadataField[]
  }) => {
    setUndoStack((s) => [
      ...s,
      {
        metadataFields: structuredClone(metadataFields),
        noteFields: structuredClone(noteFields),
      },
    ])
    setRedoStack([])
  }

  const undo = () => {
    if (!canUndo) return
    setRedoStack((s) => [...s, { metadataFields, noteFields }])

    const last = undoStack[undoStack.length - 2]
    if (!last) return

    setMetadataFields(last.metadataFields)
    setNoteFields(last.noteFields)

    setUndoStack((s) => s.slice(0, -1))
  }

  const redo = () => {
    if (!canRedo) return
    const last = redoStack[redoStack.length - 1]
    if (!last) return

    setUndoStack((s) => [...s, last])
    setMetadataFields(last.metadataFields)
    setNoteFields(last.noteFields)

    setRedoStack((s) => s.slice(0, -1))
  }

  useEffect(() => {
    const _metadataFields = ((project?.template as any)?.metadataFields ||
      []) as MetadataField[]
    const _noteFields = ((project?.template as any)?.noteFields ||
      []) as MetadataField[]

    setMetadataFields(_metadataFields)
    setNoteFields(_noteFields)

    if (_metadataFields.length || _noteFields.length) {
      updateStacks({
        metadataFields: _metadataFields,
        noteFields: _noteFields,
      })
    }
  }, [project?.template])

  const updateProject = api.project.updateProject.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while saving the template',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully saved template`,
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

  const breadcrumbItems = projectBreadcrumbs({
    projectName: project?.name,
    projectHandle: query.projectHandle as string,
  })

  const didMakeChanges =
    JSON.stringify((project?.template as any)?.metadataFields || []) !==
      JSON.stringify(metadataFields) ||
    JSON.stringify((project?.template as any)?.noteFields || []) !==
      JSON.stringify(noteFields)

  useLeavePageConfirm(
    didMakeChanges,
    'You have unsaved changes. Are you sure you want to leave?',
  )

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    if (didMakeChanges) {
      window.addEventListener('beforeunload', handler)
      return () => {
        window.removeEventListener('beforeunload', handler)
      }
    }
  }, [didMakeChanges])

  const onAddNewMetadataFieldClicked = (templateName: string) => {
    const id = nanoid(10)

    const newBlock = {
      id,
      name: '',
      variant: MetadataFieldVariant.DATETIME,
      templateName,
    }

    const newItems = [...metadataFields, newBlock]

    setMetadataFields(
      templateNames.reduce(
        (acc, templateName) => [
          ...acc,
          ...newItems.filter((item) => item.templateName === templateName),
        ],
        [] as MetadataField[],
      ),
    )

    setFieldBeingEdited(id)
  }

  const onAddNewNoteFieldClicked = (templateName: string) => {
    const id = nanoid(10)

    const newBlock = {
      id,
      name: '',
      variant: MetadataFieldVariant.NOTE,
      templateName,
    }

    const newItems = [...noteFields, newBlock]

    setNoteFields(
      templateNames.reduce(
        (acc, templateName) => [
          ...acc,
          ...newItems.filter((item) => item.templateName === templateName),
        ],
        [] as MetadataField[],
      ),
    )

    setFieldBeingEdited(id)
  }

  const onSaveMetadataFieldClicked = (
    fieldId: string,
    name: string,
    metadataBlockVariant: MetadataFieldVariant,
  ) => {
    setFieldBeingEdited(null)
    const newData = metadataFields.map((f) =>
      f.id === fieldId ? { ...f, name, variant: metadataBlockVariant } : f,
    )
    setMetadataFields(newData)
    updateStacks({
      metadataFields: newData,
      noteFields,
    })
    if (!project?.id) return
  }

  const onSaveNoteFieldClicked = (
    fieldId: string,
    name: string,
    metadataBlockVariant: MetadataFieldVariant,
    instruction?: string,
  ) => {
    setFieldBeingEdited(null)
    const newData = noteFields.map((f) =>
      f.id === fieldId
        ? { ...f, name, variant: metadataBlockVariant, instruction }
        : f,
    )
    setNoteFields(newData)
    updateStacks({
      metadataFields,
      noteFields: newData,
    })
    if (!project?.id) return
  }

  const onCancelMetadataFieldClicked = (id: string) => {
    setFieldBeingEdited(null)
    setMetadataFields((prev) =>
      prev.filter((f) =>
        !prev.find((x) => x.id === id)?.name ? f.id !== id : true,
      ),
    )
  }

  const onCancelNoteFieldClicked = (id: string) => {
    setFieldBeingEdited(null)
    setNoteFields((prev) =>
      prev.filter((f) =>
        !prev.find((x) => x.id === id)?.name ? f.id !== id : true,
      ),
    )
  }

  const saveTemplate = async () => {
    updateProject.mutateAsync({
      projectHandle: query.projectHandle as string,
      template: {
        metadataFields,
        noteFields,
      },
      templateLockId,
    })
  }

  const deleteSelectedField = async () => {
    if (!idToDelete) return
    const _metadataFields = metadataFields
      ?.filter((f) => f?.id !== idToDelete)
      .filter(Boolean) as MetadataField[]
    const _noteFields = noteFields
      ?.filter((f) => f?.id !== idToDelete)
      .filter(Boolean) as MetadataField[]

    setMetadataFields(_metadataFields)
    setNoteFields(_noteFields)
    setIdToDelete(null)
    updateStacks({
      metadataFields: _metadataFields,
      noteFields: _noteFields,
    })
  }

  const isOwner =
    project?.projectMemberships?.find(
      (membership) => membership.user?.id === session?.user.id,
    )?.projectRole === 'PROJECT_OWNER'

  if (projectIsLoading) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <SkeletonPlaceholder withHeader w='1140px' />
      </AuthenticatedLayout>
    )
  }

  const templateNames = [
    ...new Set([
      ...[...metadataFields, ...noteFields].map(
        (f) => f?.templateName || DEFAULT_TEMPLATE_NAME,
      ),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b)) as string[]

  const onChangePosition = (id: string, direction: 'up' | 'down') => {
    const isMetafield = metadataFields.find((f) => f.id === id)
    const isNoteField = noteFields.find((f) => f.id === id)

    if (!!isMetafield) {
      const index = metadataFields.findIndex((f) => f.id === id)
      const newIndex = direction === 'up' ? index - 1 : index + 1
      const newMetadataFields = [...metadataFields]
      newMetadataFields.splice(index, 1)
      const a = metadataFields[index]
      if (!a) return
      newMetadataFields.splice(newIndex, 0, a)
      setMetadataFields(newMetadataFields)
    }

    if (!!isNoteField) {
      const index = noteFields.findIndex((f) => f.id === id)
      const newIndex = direction === 'up' ? index - 1 : index + 1
      const newNoteFields = [...noteFields]
      newNoteFields.splice(index, 1)
      const a = noteFields[index]
      if (!a) return
      newNoteFields.splice(newIndex, 0, a)
      setNoteFields(newNoteFields)
    }
  }

  const projects = me?.projectMemberships
    ?.map((pm) => pm.project)
    .filter((p) => p?.id !== project?.id)
    .filter((p) => !!p)
    .filter(Boolean)
    .map((p) => ({
      label: p!.name,
      value: p!.id,
      template: p!.template as Template,
    }))

  const onReplaceClick = async (
    projectId: string,
    selectedTemplateNames: string[],
  ) => {
    const projectToCopyFrom = me?.projectMemberships
      ?.map((pm) => pm.project)
      ?.find((p) => p?.id === projectId) as any

    const template = projectToCopyFrom.template as Template

    const _metadataFields =
      template?.metadataFields.filter((m) =>
        selectedTemplateNames.includes(m.templateName || DEFAULT_TEMPLATE_NAME),
      ) || []
    const _noteFields =
      template?.noteFields.filter((m) =>
        selectedTemplateNames.includes(m.templateName || DEFAULT_TEMPLATE_NAME),
      ) || []

    setMetadataFields(_metadataFields)
    setNoteFields(_noteFields)
    setCopyTemplateFromProjectModalOpen(false)
    updateStacks({
      metadataFields: _metadataFields,
      noteFields: _noteFields,
    })
  }

  const onAppendClick = async (
    projectId: string,
    selectedTemplateNames: string[],
  ) => {
    const projectToCopyFrom = me?.projectMemberships
      ?.map((pm) => pm.project)
      ?.find((p) => p?.id === projectId) as any

    const template = projectToCopyFrom.template as Template

    const _metadataField = [
      ...metadataFields,
      ...(template?.metadataFields.filter((m) =>
        selectedTemplateNames.includes(m.templateName || DEFAULT_TEMPLATE_NAME),
      ) || []),
    ] as MetadataField[]
    const _noteFields = [
      ...noteFields,
      ...(template?.noteFields.filter((m) =>
        selectedTemplateNames.includes(m.templateName || DEFAULT_TEMPLATE_NAME),
      ) || []),
    ] as MetadataField[]

    setMetadataFields(_metadataField)
    setNoteFields(_noteFields)
    setCopyTemplateFromProjectModalOpen(false)
    updateStacks({
      metadataFields: _metadataField,
      noteFields: _noteFields,
    })
  }

  const addNewTemplateVariant = async (templateName: string) => {
    if (!templateName) return
    setNoteFields([
      ...noteFields,
      {
        id: nanoid(10),
        name: 'My notes',
        variant: MetadataFieldVariant.NOTE,
        templateName,
      },
    ])
  }

  const onTemplateRename = (
    oldName: string,
    _newName: string | null | undefined,
  ) => {
    const newName = _newName?.trim()

    if (!oldName || !newName) return

    // Check if template name already exists
    if (templateNames.includes(newName)) {
      toast({
        title: 'Template name already exists',
        description: 'Please choose a different name',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    setMetadataFields((prev) =>
      prev.map((f) =>
        (f?.templateName || DEFAULT_TEMPLATE_NAME) === oldName
          ? { ...f, templateName: newName }
          : f,
      ),
    )
    setNoteFields((prev) =>
      prev.map((f) =>
        (f?.templateName || DEFAULT_TEMPLATE_NAME) === oldName
          ? { ...f, templateName: newName }
          : f,
      ),
    )
  }

  const deleteTemplateVariant = (templateName: string) => {
    confirm({
      title: 'Delete template',
      isDanger: true,
      message: 'Are you sure you want to delete this template?',
      onConfirm: () => {
        setMetadataFields((prev) =>
          prev.filter(
            (f) => (f?.templateName || DEFAULT_TEMPLATE_NAME) !== templateName,
          ),
        )
        setNoteFields((prev) =>
          prev.filter(
            (f) => (f?.templateName || DEFAULT_TEMPLATE_NAME) !== templateName,
          ),
        )
      },
    })
  }

  const canEdit = isOwner && !isReadOnly

  return (
    <AuthenticatedLayout session={session} pageTitle={project?.name || ''}>
      <PageDocument
        header={'Note Templates'}
        breadcrumbs={breadcrumbItems.inProject}
        tabs={tabs}
      >
        {canEdit && (
          <ContentBox>
            {canEdit ? (
              <Flex
                justifyContent='space-between'
                flexDir={isSmallScreen ? 'column' : 'row'}
              >
                <ButtonGroup mb={0} variant={'outline'}>
                  <Button
                    w={isSmallScreen ? '100%' : undefined}
                    leftIcon={<MdCopyAll />}
                    onClick={() => setCopyTemplateFromProjectModalOpen(true)}
                  >
                    Import template
                  </Button>
                  <Flex alignItems='center'>
                    <InformationBadge tip='Copy templates from your existing projects' />
                  </Flex>
                </ButtonGroup>
                <Flex
                  alignItems={isSmallScreen ? 'flex-start' : 'center'}
                  flexDir={isSmallScreen ? 'column' : 'row'}
                  mt={isSmallScreen ? 2 : 0}
                >
                  {didMakeChanges ? (
                    <Text
                      mr={4}
                      fontSize='sm'
                      opacity={0.5}
                      mb={isSmallScreen ? 2 : 0}
                    >
                      Changes not saved yet
                    </Text>
                  ) : (
                    <>
                      <Flex
                        mb={isSmallScreen ? 2 : 0}
                        alignItems='center'
                        ml={2}
                        justifyContent='center'
                      >
                        <Text mr={2} fontSize='sm' opacity={0.5}>
                          Template version: {project?.templateVersion ?? '1'}
                        </Text>
                        <InformationBadge tip='Keeps track of your template version' />
                      </Flex>
                    </>
                  )}
                  <ButtonGroup mr={2} variant='ghost'>
                    <Tooltip label='Template history'>
                      <IconButton
                        onClick={() => setHistoryModalOpen(true)}
                        icon={<MdHistory />}
                        aria-label='Template history'
                      />
                    </Tooltip>
                    <IconButton
                      isDisabled={!canUndo}
                      onClick={undo}
                      icon={<BiUndo />}
                      aria-label='Undo'
                    />
                    <IconButton
                      isDisabled={!canRedo}
                      onClick={redo}
                      icon={<BiRedo />}
                      aria-label='Redo'
                    />
                  </ButtonGroup>
                  <Box
                    w={{
                      base: '100%',
                      md: 'auto',
                    }}
                    mt={{
                      base: 2,
                      md: 0,
                    }}
                  >
                    <Walkthrough stepKey='saveTemplates'>
                      {(nextStep) => (
                        <ButtonVariant
                          isDisabled={!didMakeChanges || !!fieldBeingEdited}
                          fontWeight='normal'
                          leftIcon={<AiOutlineSave />}
                          variant='outline'
                          colorScheme='blue'
                          onClick={() => {
                            nextStep()
                            saveTemplate()
                          }}
                          isLoading={updateProject.isLoading}
                          fullWidth={isSmallScreen}
                        >
                          Save templates
                        </ButtonVariant>
                      )}
                    </Walkthrough>
                  </Box>
                </Flex>
              </Flex>
            ) : (
              <></>
            )}
            {/* <TempInfoCard
              initialVisible={moment()
                .subtract(20, 'seconds')
                .isBefore(moment(project?.createdAt))}
              title={"Welcome to your project's note template design page"}
              text={
                "Here you select and define the components which will make out the note template for your project. You can always return to add or delete components in your template. NB such edits will be available in new notes but notes written in old template versions will remain in this formatting. Once you have designed your template, you can go explore other features of the platform. Invite or manage other members in the 'Members' section or go to the 'Notes' section to start writing in your new note template."
              }
            /> */}
          </ContentBox>
        )}
        {templateNames.map((templateName, i) => (
          <Walkthrough key={i} stepKey='noteTemplate'>
            <ContentBox
              minimizeId={'template' + project?.id + i}
              isMinimizable={templateNames.length !== 1}
              header={
                <>
                  <Center>
                    <EditableText
                      isEditable={canEdit}
                      valueOverride
                      fontSize='xl'
                      value={templateName}
                      onSave={(newName) => {
                        onTemplateRename(templateName, newName)
                      }}
                      onDelete={() => deleteTemplateVariant(templateName)}
                    />
                  </Center>
                </>
              }
            >
              <Flex mb={1} gap={1} alignItems='center'>
                <Heading fontSize='lg'>Context</Heading>
                <InformationBadge tip="Add and define features to your template. These will figure in the top of your note template and be saved as part of your notes. Examples could be 'date', 'time', 'situation' or other tags specific to your project, which you wish will be registered for each note created during the project." />
              </Flex>
              <Walkthrough stepKey='addContextBox2'>
                {(nextStep2) => (
                  <Walkthrough stepKey='addContextBox'>
                    {(nextStep) => (
                      <TemplateBlockTable
                        emptyStateText={'No context boxes have been added yet'}
                        addNewText={'Add new context box'}
                        metadataFields={metadataFields.filter(
                          (f) =>
                            (f?.templateName || DEFAULT_TEMPLATE_NAME) ===
                            templateName,
                        )}
                        setMetadataFields={setMetadataFields}
                        fieldBeingEdited={fieldBeingEdited}
                        setFieldBeingEdited={setFieldBeingEdited}
                        idToDelete={idToDelete}
                        setIdToDelete={setIdToDelete}
                        onNewFieldClicked={() => {
                          nextStep()
                          onAddNewMetadataFieldClicked(templateName)
                        }}
                        saveChanges={(fieldId, name, metadataBlockVariant) => {
                          nextStep2()
                          onSaveMetadataFieldClicked(
                            fieldId,
                            name,
                            metadataBlockVariant,
                          )
                        }}
                        cancelChanges={onCancelMetadataFieldClicked}
                        addDisabled={!!fieldBeingEdited}
                        onChangePosition={onChangePosition}
                        disableEditing={!canEdit}
                      />
                    )}
                  </Walkthrough>
                )}
              </Walkthrough>
              <Flex mt={8} mb={2} gap={1} alignItems='center'>
                <Heading fontSize='lg'>Text</Heading>
                <InformationBadge tip='Add and define number of text fields you wish in your template. There are unlimited characters for each text box.' />
              </Flex>
              <Walkthrough stepKey='saveTextBox'>
                {(saveTextBox) => (
                  <Walkthrough stepKey='addTextBox'>
                    {(addTextBox) => (
                      <TemplateBlockTable
                        emptyStateText={'No text fields have been added yet'}
                        addNewText={'Add new text field'}
                        onlyNoteFields
                        metadataFields={noteFields.filter(
                          (f) =>
                            (f?.templateName || DEFAULT_TEMPLATE_NAME) ===
                            templateName,
                        )}
                        setMetadataFields={setNoteFields}
                        fieldBeingEdited={fieldBeingEdited}
                        setFieldBeingEdited={setFieldBeingEdited}
                        idToDelete={idToDelete}
                        setIdToDelete={setIdToDelete}
                        onNewFieldClicked={() => {
                          addTextBox()
                          onAddNewNoteFieldClicked(templateName)
                        }}
                        saveChanges={(
                          fieldId,
                          name,
                          metadataBlockVariant,
                          instruction,
                        ) => {
                          saveTextBox()
                          onSaveNoteFieldClicked(
                            fieldId,
                            name,
                            metadataBlockVariant,
                            instruction,
                          )
                        }}
                        cancelChanges={onCancelNoteFieldClicked}
                        addDisabled={!!fieldBeingEdited}
                        onChangePosition={onChangePosition}
                        disableEditing={!canEdit}
                      />
                    )}
                  </Walkthrough>
                )}
              </Walkthrough>
            </ContentBox>
          </Walkthrough>
        ))}
        {canEdit && (
          <Center mt={4}>
            <ButtonGroup variant='outline'>
              <Button onClick={() => setNewTemplateVariantModalOpen(true)}>
                Create new template
              </Button>
            </ButtonGroup>
          </Center>
        )}
      </PageDocument>
      <Confirm
        isOpen={!!idToDelete}
        title={'Delete Field'}
        message={'Are you sure you want to delete this field?'}
        onCancel={() => setIdToDelete(null)}
        isDanger
        onConfirm={deleteSelectedField}
      />
      <CopyTemplateFromProjectModal
        isOpen={copyTemplateFromProjectModalOpen}
        onClose={() => setCopyTemplateFromProjectModalOpen(false)}
        options={projects || []}
        onReplaceClick={onReplaceClick}
        onAppendClick={onAppendClick}
      />
      <NewTemplateModal
        isOpen={newTemplateVariantModalOpen}
        onClose={() => setNewTemplateVariantModalOpen(false)}
        onSave={(name) => {
          addNewTemplateVariant(name)
          setNewTemplateVariantModalOpen(false)
        }}
      />
      <TemplateHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
      <LockedByModal
        isOpen={lockModalIsOpen}
        onReadOnlyClick={() => {
          setIsReadOnly(true)
          setLockModalIsOpen(false)
        }}
        onTakeOverClick={onTakeOverClick}
        lockedByName={
          project?.templateLockedByUser?.fullName ||
          project?.templateLockedByUser?.email
        }
        lockedByHue={project?.templateLockedByUser?.avatarHue}
        overwriteName={'template'}
      />
    </AuthenticatedLayout>
  )
}

export default ProjectTemplate
