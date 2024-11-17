import { FC, useCallback, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  MenuButton,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react'
import { AccessibilityLevel, ProjectRole } from '@prisma/client'
import { DEFAULT_TEMPLATE_NAME } from 'constants/constants'
import Fuse from 'fuse.js'
import { reverse } from 'lodash'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import {
  AiOutlineBorder,
  AiOutlineCheckSquare,
  AiOutlineCloudDownload,
  AiOutlineDelete,
  AiOutlineFileImage,
  AiOutlineMinusSquare,
  AiOutlinePlus,
  AiOutlineSearch,
  AiOutlineSortAscending,
  AiOutlineUnorderedList,
} from 'react-icons/ai'
import { FiChevronDown, FiChevronUp, FiMapPin } from 'react-icons/fi'
import { IoIosMore } from 'react-icons/io'
import { IoArrowForwardOutline } from 'react-icons/io5'
import { MdCopyAll, MdLabelOutline, MdOutlineLayers } from 'react-icons/md'
import { VscGroupByRefType } from 'react-icons/vsc'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { projectBreadcrumbs } from 'utils/projectBreadcrumbs'
import { serializeSlateJson } from 'utils/slateHelper'
import { useConfirm } from 'hooks/useConfirm'
import { useGlobalState } from 'hooks/useGlobalState'
import { useIsMinimizedStore } from 'hooks/useIsMinimizedStore'
import { GroupMethod, useNoteGroupingStore } from 'hooks/useNoteGroupingStore'
import { SortMethod, useNoteSortingStore } from 'hooks/useNoteSortingStore'
import { useProjectTabsItems } from 'hooks/useProjectTabsItems'
import { useStyle } from 'hooks/useStyle'
import {
  ButtonVariant,
  ContentBox,
  DropdownMenu,
  ExportModal,
  MoveFieldnotesModal,
  NewNoteModal,
  NoteCard,
  NoteFilter,
  PageDocument,
  SkeletonPlaceholder,
  TagsOverview,
  Walkthrough,
} from 'components'
import { DropdownOption } from 'components/common/DropdownMenu'
import ProjectFiles from 'components/note/files'
import ProjectMap from 'components/note/map'

const ProjectNotes: FC<NextPage> = () => {
  const { data: session } = useSession()
  const { query, push } = useRouter()
  const { hoverBg } = useStyle()
  const tabs = useProjectTabsItems()
  const utils = api.useContext()
  const toast = useToast()
  const { confirm } = useConfirm()
  const { lockId, isSmallScreen } = useGlobalState()
  const [exportModalIsOpen, setExportModalIsOpen] = useState(false)
  const [moveFieldnoteModalIsOpen, setMoveFieldnoteIsOpen] = useState<
    'move' | 'copy' | null
  >(null)

  const [activeView, setActiveView] = useState('List')

  const [newNoteModalOpen, setNewNoteModalOpen] = useState(false)
  const [searchWord, setSearchWord] = useState('')
  const [memberIdFilter, setMemberIdFilter] = useState<string[]>([])
  const [_selectedNotes, setSelectedNotes] = useState<string[]>([])

  const { sortBy: _sortBy, setSortBy: _setSortBy } = useNoteSortingStore()
  const sortBy = _sortBy(query.projectHandle as string)
  const setSortBy = (method: SortMethod) =>
    _setSortBy(query.projectHandle as string, method)

  const { groupBy: _groupBy, setGroupBy: _setGroupBy } = useNoteGroupingStore()
  const groupBy = _groupBy(query.projectHandle as string)
  const setGroupBy = (method: GroupMethod) =>
    _setGroupBy(query.projectHandle as string, method)

  // Minimize categories
  const { minimizedIds, addMinimizedId, removeMinimizedId } =
    useIsMinimizedStore()

  const [activeTemplateNameFilters, setActiveTemplateNameFilters] = useState<
    string[]
  >([])
  const [isExporting, setIsExporting] = useState(false)

  const { data: project, isLoading: projectIsLoading } =
    api.project.project.useQuery(
      {
        handle: query.projectHandle as string,
      },
      {
        enabled: !!query.projectHandle,
      },
    )

  const notes = project?.notes
  const isOwner = !!project?.projectMemberships?.find(
    (pm) =>
      pm?.user?.id === session?.user.id &&
      pm?.projectRole === ProjectRole.PROJECT_OWNER,
  )

  const deleteNotes = api.project.deleteNotes.useMutation({
    onError(err) {
      toast({
        title: 'An error occurred while deleting notes',
        description: err.message,
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
    onSuccess() {
      toast({
        title: `Successfully deleted notes`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
    },
    onSettled() {
      setSelectedNotes([])
      utils.project.project.invalidate()
    },
  })

  const onlyVisibleToYou = useCallback(
    (note: NonNullable<typeof notes>[0]) => {
      const isNoteOwner = note?.author?.id === session?.user?.id
      const couldBeHidden =
        project?.accessibilityLevel &&
        (
          [
            AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL,
            AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER,
          ] as AccessibilityLevel[]
        ).includes(project?.accessibilityLevel)
      return isNoteOwner && couldBeHidden && !note?.isVisible
    },
    [notes, session],
  )

  const breadcrumbItems = projectBreadcrumbs({
    projectName: project?.name,
    projectHandle: query.projectHandle as string,
  })

  const withFuzzySearch = (input: typeof notes): typeof notes => {
    if (!searchWord) {
      return input
    }

    const list =
      input?.map((note) => {
        return {
          id: note.id,
          title: note.title || '',
          author: note.author?.fullName || '',
          metadataFields:
            note.metadataFields
              .map((field) => JSON.stringify(field?.value))
              .join(' ') || '',
          noteFields:
            note.noteFields
              .map((field) => serializeSlateJson(field?.content))
              .join(' ') || '',
        }
      }) || []

    const options = {
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      shouldSort: true,
      threshold: 0.4,
      keys: ['title', 'author', 'metadataFields', 'noteFields'],
    } as Fuse.IFuseOptions<(typeof list)[0]>

    const fuse = new Fuse(list, options)
    const searchResult = fuse.search(searchWord.trim())

    return searchResult
      .map((result) => input?.find((note) => note.id === result.item.id))
      .filter(Boolean) as typeof notes
  }

  const visibleNotes = withFuzzySearch(notes)
    ?.filter(
      (n) =>
        activeTemplateNameFilters.length === 0 ||
        (n.templateName && activeTemplateNameFilters.includes(n.templateName)),
    )
    ?.filter(
      (n) =>
        memberIdFilter.length === 0 ||
        (n.author?.id && memberIdFilter.includes(n.author?.id)),
    )
    ?.sort((a, b) =>
      !searchWord ? b.updatedAt.getTime() - a.updatedAt.getTime() : 0,
    )

  const selectedNotes = _selectedNotes.filter(
    (id) => visibleNotes?.find((note) => note?.id === id),
  )

  const onSelectToggle = (id: string) => {
    if (selectedNotes.includes(id)) {
      setSelectedNotes(selectedNotes.filter((noteId) => noteId !== id))
    } else {
      setSelectedNotes([...selectedNotes, id])
    }
  }

  const selectAll = () => {
    if (selectedNotes.length === visibleNotes?.length) {
      setSelectedNotes([])
    } else {
      setSelectedNotes(visibleNotes?.map((note) => note?.id) || [])
    }
  }

  const deselectAll = () => {
    setSelectedNotes([])
  }

  const allSelected =
    selectedNotes.length === visibleNotes?.length && visibleNotes?.length > 0

  const someSelected = selectedNotes.length > 0

  const deleteSelectedNotes = () => {
    confirm({
      title: 'Delete Notes',
      message: `Are you sure you want to delete ${selectedNotes.length} note${
        selectedNotes.length > 1 ? 's' : ''
      }?`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteNotes.mutate({
          ids: selectedNotes,
        })
      },
    })
  }

  // const filesFromSelected = selectedNotes
  //   .map((noteId) => notes?.find((note) => note?.id === noteId))
  //   .filter((note) => (note?.files?.length || 0) > 0)
  //   .map((note) => note?.files.map((f) => ({ ...f, note })))
  //   .flat()
  //   .map((file) => ({
  //     name: file?.name || 'file',
  //     signedUrl: file?.signedUrl || '',
  //     projectName: project?.name || '',
  //     noteName: file?.note?.title || '',
  //     createdAt: file?.createdAt || new Date(),
  //   }))

  const sortByButtons = [
    {
      label: 'Created (newest)',
      onClick: () => setSortBy('created_newest'),
      isActive: sortBy === 'created_newest',
    },
    {
      label: 'Created (oldest)',
      onClick: () => setSortBy('created_oldest'),
      isActive: sortBy === 'created_oldest',
    },
    {
      label: 'Updated (newest)',
      onClick: () => setSortBy('updated_newest'),
      isActive: sortBy === 'updated_newest',
    },
    {
      label: 'Updated (oldest)',
      onClick: () => setSortBy('updated_oldest'),
      isActive: sortBy === 'updated_oldest',
    },
    {
      label: 'Author (a-z)',
      onClick: () => setSortBy('author_az'),
      isActive: sortBy === 'author_az',
    },
    {
      label: 'Author (z-a)',
      onClick: () => setSortBy('author_za'),
      isActive: sortBy === 'author_za',
    },
    {
      label: 'Title (a-z)',
      onClick: () => setSortBy('title_az'),
      isActive: sortBy === 'title_az',
    },
    {
      label: 'Title (z-a)',
      onClick: () => setSortBy('title_za'),
      isActive: sortBy === 'title_za',
    },
    {
      label: 'Template (a-z)',
      onClick: () => setSortBy('template_az'),
      isActive: sortBy === 'template_az',
    },
    {
      label: 'Template (z-a)',
      onClick: () => setSortBy('template_za'),
      isActive: sortBy === 'template_za',
    },
  ]

  const groupByButtons = [
    {
      label: 'None',
      onClick: () => setGroupBy('none'),
      isActive: groupBy === 'none',
    },
    {
      label: 'Week',
      onClick: () => setGroupBy('week'),
      isActive: groupBy === 'week',
    },
    {
      label: 'Month',
      onClick: () => setGroupBy('month'),
      isActive: groupBy === 'month',
    },
    {
      label: 'Year',
      onClick: () => setGroupBy('year'),
      isActive: groupBy === 'year',
    },
    {
      label: 'Author',
      onClick: () => setGroupBy('author'),
      isActive: groupBy === 'author',
    },
    {
      label: 'Template',
      onClick: () => setGroupBy('template'),
      isActive: groupBy === 'template',
    },
  ]

  const sortNotes = (
    noteA: NonNullable<typeof notes>[0],
    noteB: NonNullable<typeof notes>[0],
  ) => {
    if (searchWord) return 0
    if (sortBy === 'updated_newest') {
      return noteB.updatedAt.getTime() - noteA.updatedAt.getTime()
    } else if (sortBy === 'updated_oldest') {
      return noteA.updatedAt.getTime() - noteB.updatedAt.getTime()
    } else if (sortBy === 'created_newest') {
      return noteB.createdAt.getTime() - noteA.createdAt.getTime()
    } else if (sortBy === 'created_oldest') {
      return noteA.createdAt.getTime() - noteB.createdAt.getTime()
    } else if (sortBy === 'author_az') {
      return (noteA.author?.fullName || '')
        .toLowerCase()
        .localeCompare((noteB.author?.fullName || '').toLowerCase())
    } else if (sortBy === 'author_za') {
      return (noteA.author?.fullName || '')
        .toLowerCase()
        .localeCompare((noteB.author?.fullName || '').toLowerCase())
    } else if (sortBy === 'title_az') {
      return (noteA.title || '')
        .toLowerCase()
        .localeCompare((noteB.title || '').toLowerCase())
    } else if (sortBy === 'title_za') {
      return (noteB.title || '')
        .toLowerCase()
        .localeCompare((noteA.title || '').toLowerCase())
    } else if (sortBy === 'template_az') {
      return (noteA.templateName || '')
        .toLowerCase()
        .localeCompare((noteB.templateName || '').toLowerCase())
    } else if (sortBy === 'template_za') {
      return (noteB.templateName || '')
        .toLowerCase()
        .localeCompare((noteA.templateName || '').toLowerCase())
    }
    return 0
  }

  const templateNames = [
    ...new Set(notes?.map((n) => n.templateName || DEFAULT_TEMPLATE_NAME)),
  ]

  const notesMembers = notes?.map((n) => ({
    name: n.author?.fullName ?? n.author?.email,
    id: n.author?.id,
  }))

  const VisibleNotesOutOfTotal = () => {
    const showOutOf = !(
      !notes?.length || visibleNotes?.length === notes?.length
    )

    if (!showOutOf && !selectedNotes?.length) return null

    return (
      <Flex alignItems='center' opacity={0.5} ml={1}>
        <Text fontSize='sm'>
          {showOutOf
            ? `Showing ${visibleNotes?.length} out of ${notes?.length}`
            : ''}
          {selectedNotes?.length ? ` (${selectedNotes?.length} selected)` : ''}
        </Text>
      </Flex>
    )
  }

  const getSortingCategories = useCallback((): {
    cateogiories: string[]
    filteringFunction: (
      note: NonNullable<typeof notes>[0],
      category: string,
    ) => boolean
  } => {
    const authorFilter = (
      note: NonNullable<typeof notes>[0],
      category: string,
    ) => note.author?.fullName === category || note.author?.email === category

    const templateFilter = (
      note: NonNullable<typeof notes>[0],
      category: string,
    ) => (note.templateName || DEFAULT_TEMPLATE_NAME) === category

    const weekStringFromNote = (
      note: NonNullable<typeof notes>[0],
      type: 'createdAt' | 'updatedAt',
    ) => moment(note[type]).format('[Week] w, YYYY')

    const weekFilter = (
      note: NonNullable<typeof notes>[0],
      category: string,
      type: 'createdAt' | 'updatedAt',
    ) => weekStringFromNote(note, type) === category

    const monthSpringFromNote = (
      note: NonNullable<typeof notes>[0],
      type: 'createdAt' | 'updatedAt',
    ) => moment(note[type]).format('MMMM YYYY')

    const monthFilter = (
      note: NonNullable<typeof notes>[0],
      category: string,
      type: 'createdAt' | 'updatedAt',
    ) => monthSpringFromNote(note, type) === category

    const yearStringFromNote = (
      note: NonNullable<typeof notes>[0],
      type: 'createdAt' | 'updatedAt',
    ) => moment(note[type]).format('YYYY')

    const yearFilter = (
      note: NonNullable<typeof notes>[0],
      category: string,
      type: 'createdAt' | 'updatedAt',
    ) => yearStringFromNote(note, type) === category

    const sortWeeks = (a: string, b: string) => {
      const aMoment = moment(a, '[Week] w, YYYY')
      const bMoment = moment(b, '[Week] w, YYYY')
      if (aMoment.isBefore(bMoment)) return 1
      if (aMoment.isAfter(bMoment)) return -1
      return 0
    }

    const weeksFromNotes = (type: 'createdAt' | 'updatedAt') =>
      (
        notes?.reduce(
          (acc, note) => [...new Set([...acc, weekStringFromNote(note, type)])],
          [] as string[],
        ) as string[]
      ).sort(sortWeeks)

    switch (groupBy) {
      case 'week': {
        return {
          cateogiories: weeksFromNotes('createdAt'),
          filteringFunction: (n, c) => weekFilter(n, c, 'createdAt'),
        }
      }
      // case 'updated_oldest': {
      //   return {
      //     cateogiories: reverse([...weeksFromNotes('updatedAt')]),
      //     filteringFunction: (n, c) => weekFilter(n, c, 'updatedAt'),
      //   }
      // }
      // case 'created_newest': {
      //   return {
      //     cateogiories: weeksFromNotes('createdAt'),
      //     filteringFunction: (n, c) => weekFilter(n, c, 'createdAt'),
      //   }
      // }
      // case 'created_oldest': {
      //   return {
      //     cateogiories: reverse([...weeksFromNotes('createdAt')]),
      //     filteringFunction: (n, c) => weekFilter(n, c, 'createdAt'),
      //   }
      // }
      case 'month': {
        return {
          cateogiories: [
            ...new Set(
              notes?.map((n) => monthSpringFromNote(n, 'createdAt')) || [],
            ),
          ].sort() as string[],
          filteringFunction: (n, c) => monthFilter(n, c, 'createdAt'),
        }
      }
      case 'year': {
        return {
          cateogiories: [
            ...new Set(
              notes?.map((n) => yearStringFromNote(n, 'createdAt')) || [],
            ),
          ].sort() as string[],
          filteringFunction: (n, c) => yearFilter(n, c, 'createdAt'),
        }
      }
      case 'author': {
        return {
          cateogiories: [
            ...new Set(
              notes?.map((n) => n.author?.fullName || n.author?.email) || [],
            ),
          ].sort() as string[],
          filteringFunction: authorFilter,
        }
      }
      // case 'author_za': {
      //   return {
      //     cateogiories: reverse(
      //       [
      //         ...new Set(
      //           notes?.map((n) => n.author?.fullName || n.author?.email) || [],
      //         ),
      //       ].sort(),
      //     ) as string[],
      //     filteringFunction: authorFilter,
      //   }
      // }
      case 'template': {
        return {
          cateogiories: templateNames.sort(),
          filteringFunction: templateFilter,
        }
      }
      // case 'template_za': {
      //   return {
      //     cateogiories: reverse([...templateNames.sort()]),
      //     filteringFunction: templateFilter,
      //   }
      // }
      case 'none': {
        return {
          cateogiories: [''],
          filteringFunction: () => true,
        }
      }
      default: {
        return {
          cateogiories: [''],
          filteringFunction: () => true,
        }
      }
    }
  }, [sortBy, visibleNotes])

  const moreDropdownOptions = [
    {
      label: 'Delete selected',
      onClick: () => deleteSelectedNotes(),
      icon: <AiOutlineDelete />,
      isDisabled: !selectedNotes.length,
    },
    {
      label: 'Move selected to another project',
      onClick: () => setMoveFieldnoteIsOpen('move'),
      icon: <IoArrowForwardOutline />,
      isDisabled: !selectedNotes.length,
    },
    {
      label: 'Copy selected to another project',
      onClick: () => setMoveFieldnoteIsOpen('copy'),
      icon: <MdCopyAll />,
      isDisabled: !selectedNotes.length,
    },
  ] as DropdownOption[]

  const NoteListFunctions = () => {
    return (
      <Flex
        gap={2}
        mb={{
          base: 2,
          md: 4,
        }}
      >
        <Tooltip label={allSelected ? 'Deselect All' : 'Select All'}>
          <IconButton
            variant='outline'
            py={isSmallScreen ? 5 : undefined}
            onClick={allSelected ? deselectAll : selectAll}
            isDisabled={!notes?.length}
            icon={
              allSelected ? (
                <AiOutlineCheckSquare />
              ) : someSelected ? (
                <AiOutlineMinusSquare />
              ) : (
                <AiOutlineBorder />
              )
            }
            aria-label={'Select'}
          />
        </Tooltip>
        <DropdownMenu options={sortByButtons} tooltip='Sort by'>
          <MenuButton
            fontWeight='normal'
            as={IconButton}
            variant='outline'
            py={isSmallScreen ? 5 : undefined}
            icon={<AiOutlineSortAscending />}
          />
        </DropdownMenu>
        <DropdownMenu options={groupByButtons} tooltip='Group by'>
          <MenuButton
            fontWeight='normal'
            as={IconButton}
            variant='outline'
            py={isSmallScreen ? 5 : undefined}
            icon={<VscGroupByRefType />}
          />
        </DropdownMenu>
        <ButtonGroup>
          <Button
            isDisabled={selectedNotes.length === 0}
            fontWeight='normal'
            py={isSmallScreen ? 5 : undefined}
            variant='outline'
            leftIcon={<AiOutlineCloudDownload />}
            isLoading={isExporting}
            onClick={() => setExportModalIsOpen(true)}
          >
            Download selected
          </Button>

          {isOwner && (
            <Tooltip label='Delete selected'>
              <DropdownMenu options={moreDropdownOptions}>
                <IconButton
                  variant='outline'
                  opacity={selectedNotes.length > 0 ? 1 : 0.4}
                  fontWeight='normal'
                  isDisabled={!selectedNotes.length}
                  py={isSmallScreen ? 5 : undefined}
                  icon={<IoIosMore />}
                  onClick={deleteSelectedNotes}
                  aria-label={'Delete'}
                />
              </DropdownMenu>
            </Tooltip>
          )}
        </ButtonGroup>
        {!isSmallScreen && <VisibleNotesOutOfTotal />}
      </Flex>
    )
  }

  if (projectIsLoading) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Project'}>
        <SkeletonPlaceholder withHeader w='1140px' />
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout session={session} pageTitle={project?.name || ''}>
      <PageDocument
        header={'Notes'}
        breadcrumbs={breadcrumbItems.inProject}
        tabs={tabs}
      >
        {project?.description ? (
          <ContentBox>
            <Box opacity={0.8}>{project?.description}</Box>
          </ContentBox>
        ) : (
          <></>
        )}
        <ContentBox>
          <Flex
            // justifyContent='flex-end'
            gap={2}
            flexDir={isSmallScreen ? 'column' : 'row'}
            w={isSmallScreen ? '100%' : undefined}
          >
            <ButtonGroup isAttached>
              {[
                { view: 'List', icon: <AiOutlineUnorderedList /> },
                { view: 'Attachments', icon: <AiOutlineFileImage /> },
                { view: 'Tags', icon: <MdLabelOutline /> },
                { view: 'Map', icon: <FiMapPin /> },
              ].map(({ view, icon }, i) => (
                <Button
                  key={i}
                  w={isSmallScreen ? '100%' : undefined}
                  leftIcon={icon}
                  {...(isSmallScreen ? { icon } : {})}
                  as={isSmallScreen ? IconButton : Button}
                  borderWidth={1}
                  variant={'outline'}
                  bg={view === activeView ? { hoverBg } : 'transparent'}
                  onClick={() => setActiveView(view)}
                >
                  {view}
                </Button>
              ))}
            </ButtonGroup>
            <Flex gap={2} w='100%'>
              <InputGroup w='100%'>
                <InputLeftElement pointerEvents='none'>
                  <AiOutlineSearch opacity={0.4} />
                </InputLeftElement>
                <Input
                  placeholder='Search...'
                  variant='themed'
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                />
              </InputGroup>
              <NoteFilter
                activeTemplateNameFilters={activeTemplateNameFilters}
                setActiveTemplateNameFilters={setActiveTemplateNameFilters}
                options={templateNames}
                memberIdFilter={memberIdFilter}
                setMemberIdFilter={setMemberIdFilter}
                notesMembers={notesMembers}
                myId={session?.user.id}
              />
            </Flex>
          </Flex>

          {/* </Grid> */}
        </ContentBox>
        {activeView === 'List' && (
          <ContentBox mb={0}>
            <Flex
              gap={{
                base: 0,
                md: 2,
              }}
              justifyContent='space-between'
              flexDir={{
                base: 'column',
                md: 'row',
              }}
            >
              <NoteListFunctions />
              <Walkthrough stepKey='newNote'>
                {(nextStep) => (
                  <ButtonVariant
                    leftIcon={<AiOutlinePlus />}
                    variant='outline'
                    colorScheme='blue'
                    onClick={() => {
                      nextStep()
                      setNewNoteModalOpen(true)
                    }}
                    fullWidth={isSmallScreen}
                  >
                    New note
                  </ButtonVariant>
                )}
              </Walkthrough>
            </Flex>
            {isSmallScreen && (
              <Box
                mb={2}
                mt={{
                  base: 2,
                  md: -2,
                }}
              >
                <VisibleNotesOutOfTotal />
              </Box>
            )}
            <Box mb={visibleNotes?.length ? -4 : 0}>
              {visibleNotes?.length ? (
                <>
                  {getSortingCategories().cateogiories.map((category) => {
                    const notes = visibleNotes
                      ?.filter((n) =>
                        getSortingCategories().filteringFunction(n, category),
                      )
                      .sort(sortNotes)

                    if (notes.length === 0) return null
                    const moreCategories =
                      getSortingCategories().cateogiories.length > 1

                    const minimizeId =
                      'note-category' + query.projectHandle + '.' + category
                    const isMinimized = minimizedIds.includes(minimizeId)
                    const toggleMinimized = () => {
                      isMinimized
                        ? removeMinimizedId(minimizeId)
                        : addMinimizedId(minimizeId)
                    }

                    return (
                      <Box mb={4}>
                        {moreCategories && (
                          <Flex gap={1}>
                            <Text fontWeight='bold' fontSize={18} mb={2}>
                              {category}
                            </Text>
                            <IconButton
                              transform='translateY(-6%)'
                              icon={
                                isMinimized ? (
                                  <FiChevronDown />
                                ) : (
                                  <FiChevronUp />
                                )
                              }
                              aria-label=''
                              size='sm'
                              variant='ghost'
                              onClick={toggleMinimized}
                            />
                          </Flex>
                        )}
                        <Box
                          h={isMinimized && moreCategories ? 0 : undefined}
                          overflow='hidden'
                        >
                          {notes.map((note, i) => {
                            const lockedByName =
                              moment(note.lockedAt).isAfter(
                                moment().subtract(5, 'minutes'),
                              ) &&
                              note.lockId !== lockId &&
                              (note.lockedByUser?.fullName ||
                                note.lockedByUser?.email)
                            const lockedByHue = lockedByName
                              ? note.lockedByUser?.avatarHue
                              : undefined

                            return (
                              <NoteCard
                                key={note.id}
                                searchWord={searchWord}
                                isFirst={i === 0}
                                isLast={i === notes.length - 1}
                                onClick={() =>
                                  push(
                                    `/projects/${query.projectHandle}/notes/${note.handle}`,
                                  )
                                }
                                title={note.title}
                                createdAt={note.createdAt}
                                updatedAt={note.updatedAt}
                                createdByName={note.author?.fullName}
                                createdByHue={note.author?.avatarHue}
                                createdByEmail={note.author?.email}
                                isSelected={selectedNotes.includes(note.id)}
                                onSelectToggle={() => onSelectToggle(note.id)}
                                onlyVisibleToYou={!!onlyVisibleToYou(note)}
                                amountOfComments={note._count.comments}
                                amountOfPds={
                                  note.files.filter(
                                    (file) =>
                                      file.mimeType === 'application/pdf',
                                  ).length
                                }
                                amountOfImages={
                                  note.files.filter((file) =>
                                    file.mimeType.startsWith('image/'),
                                  ).length
                                }
                                amountOfVideos={
                                  note.files.filter((file) =>
                                    file.mimeType.startsWith('video/'),
                                  ).length
                                }
                                amountOfRecordings={
                                  note.files.filter((file) =>
                                    file.mimeType.startsWith('audio/'),
                                  ).length
                                }
                                templateName={
                                  templateNames.length > 1
                                    ? note.templateName || DEFAULT_TEMPLATE_NAME
                                    : undefined
                                }
                                lockedByName={lockedByName || ''}
                                lockedByHue={lockedByHue ?? undefined}
                                noteHandle={note.handle}
                              />
                            )
                          })}
                        </Box>
                      </Box>
                    )
                  })}
                </>
              ) : (
                <Center>
                  <Text opacity={0.8} my={6}>
                    {searchWord
                      ? 'No notes matched this search word'
                      : 'No notes added yet'}
                  </Text>
                </Center>
              )}
            </Box>
          </ContentBox>
        )}
        {activeView === 'Attachments' && (
          <ProjectFiles project={project} visibleNotes={visibleNotes} />
        )}
        {activeView === 'Tags' && (
          <>
            <TagsOverview project={project} visibleNotes={visibleNotes} />
          </>
        )}
        {activeView === 'Map' && (
          <ProjectMap project={project} visibleNotes={visibleNotes} />
        )}
      </PageDocument>
      <NewNoteModal
        isOpen={newNoteModalOpen}
        onClose={() => setNewNoteModalOpen(false)}
        projectHandle={query.projectHandle as string}
        templateNames={
          (project?.templateNames || [DEFAULT_TEMPLATE_NAME]) as string[]
        }
      />
      <ExportModal
        isOpen={exportModalIsOpen}
        onClose={() => setExportModalIsOpen(false)}
        isExporting={isExporting}
        setIsExporting={setIsExporting}
        selectedNotes={selectedNotes}
        projectName={project?.name}
        projectId={project?.id}
        notes={notes}
      />
      <MoveFieldnotesModal
        currentProjectId={project?.id}
        type={moveFieldnoteModalIsOpen}
        onClose={() => setMoveFieldnoteIsOpen(null)}
        selectedNotes={selectedNotes}
        setSelectedNotes={setSelectedNotes}
      />
    </AuthenticatedLayout>
  )
}

export default ProjectNotes
