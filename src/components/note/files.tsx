import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  ButtonGroup,
  Center,
  Grid,
  Heading,
  IconButton,
  MenuButton,
  Text,
} from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import saveAs from 'file-saver'
import { AiOutlineSortAscending } from 'react-icons/ai'
import { AppRouter } from 'server/api/root'

import {
  AttachmentsFilter,
  ContentBox,
  DropdownMenu,
  ExportFilesAsZip,
  FileCard,
  MediaViewer,
} from 'components'

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const ProjectFiles: FC<Props> = (p) => {
  const { query, push } = useRouter()
  const [indexToView, setIndexToView] = useState<number>()
  const [sortBy, setSortBy] = useState<
    | 'created_newest'
    | 'created_oldest'
    | 'file_type_az'
    | 'file_type_za'
    | 'note_title_az'
    | 'note_title_za'
    | 'author_az'
    | 'author_za'
    | 'title_az'
    | 'title_za'
  >('created_newest')
  const [fileFilter, setFileFilter] = useState<string[]>([])

  const files = p.visibleNotes?.flatMap((note) =>
    note.files.map((f) => ({
      ...f,
      projectName: p.project?.name,
      noteName: note.title,
      author: note.author,
    })),
  )

  const onDownloadClicked = ({
    signedUrl,
    name,
  }: {
    signedUrl: string
    name: string
  }) => {
    saveAs(signedUrl, name)
  }

  const onGoToNoteClicked = (file: NonNullable<typeof files>[0]) => {
    const handle = file.note?.handle
    push(`/projects/${query.projectHandle}/notes/${handle}`)
  }

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
      label: 'File Type (a-z)',
      onClick: () => setSortBy('file_type_az'),
      isActive: sortBy === 'file_type_az',
    },
    {
      label: 'File Type (z-a)',
      onClick: () => setSortBy('file_type_za'),
      isActive: sortBy === 'file_type_za',
    },
    {
      label: 'Note Title (a-z)',
      onClick: () => setSortBy('note_title_az'),
      isActive: sortBy === 'note_title_az',
    },
    {
      label: 'Note Title (z-a)',
      onClick: () => setSortBy('note_title_za'),
      isActive: sortBy === 'note_title_za',
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
  ]

  const sortFiles = (
    fileA: NonNullable<typeof files>[0],
    fileB: NonNullable<typeof files>[0],
  ) => {
    if (
      sortBy === 'created_newest' ||
      sortBy === 'file_type_az' ||
      sortBy === 'file_type_za' ||
      sortBy === 'note_title_az' ||
      sortBy === 'note_title_za' ||
      sortBy === 'author_az' ||
      sortBy === 'author_za'
    ) {
      return fileB.createdAt.getTime() - fileA.createdAt.getTime()
    } else if (sortBy === 'created_oldest') {
      return fileA.createdAt.getTime() - fileB.createdAt.getTime()
    }
    return 0
  }

  const hasFiles = (files || []).length > 0

  const categories = {
    file_type_az: [...new Set(files?.map((f) => f.mimeType) || [])].sort(
      (a, b) => a.localeCompare(b),
    ),
    file_type_za: [...new Set(files?.map((f) => f.mimeType) || [])].sort(
      (a, b) => b.localeCompare(a),
    ),
    note_title_az: [...new Set(files?.map((f) => f.noteName) || [])].sort(
      (a, b) => a.localeCompare(b),
    ),
    note_title_za: [...new Set(files?.map((f) => f.noteName) || [])].sort(
      (a, b) => b.localeCompare(a),
    ),
    author_az: [
      ...new Set(
        files?.map((f) => f.author?.fullName || f.author?.email || '') || [],
      ),
    ].sort((a, b) => a.localeCompare(b)),
    author_za: [
      ...new Set(
        files?.map((f) => f.author?.fullName || f.author?.email || '') || [],
      ),
    ].sort((a, b) => a.localeCompare(b)),
  }[sortBy as string] || [null]

  const filter = (
    category: string | null | undefined,
    file: NonNullable<typeof files>[0],
  ) => {
    if (!category) return true
    if (sortBy.startsWith('file_type')) {
      return file.mimeType === category
    } else if (sortBy.startsWith('note_title')) {
      return file.noteName === category
    } else if (sortBy.startsWith('author')) {
      return (
        file.author?.fullName === category || file.author?.email === category
      )
    } else {
      return true
    }
  }

  const filterFileType = (file: NonNullable<typeof files>[0]) => {
    if (fileFilter.length === 0) return true
    return fileFilter.some((filter) => {
      if (filter === 'Image') {
        return file.mimeType.startsWith('image')
      } else if (filter === 'Video') {
        return file.mimeType.startsWith('video')
      } else if (filter === 'Audio') {
        return file.mimeType.startsWith('audio')
      } else if (filter === 'Document') {
        return (
          file.mimeType.startsWith('text') ||
          file.mimeType.startsWith('application')
        )
      } else if (filter === 'PDF') {
        return file.mimeType === 'application/pdf'
      } else {
        return false
      }
    })
  }

  return (
    <>
      <ContentBox>
        {hasFiles ? (
          <>
            <ButtonGroup>
              <DropdownMenu options={sortByButtons} tooltip='Sort by'>
                <MenuButton
                  fontWeight='normal'
                  as={IconButton}
                  variant='outline'
                  icon={<AiOutlineSortAscending />}
                />
              </DropdownMenu>
              <AttachmentsFilter
                fileFilter={fileFilter}
                setFileFilter={setFileFilter}
              />
              <ExportFilesAsZip
                files={files?.filter(filterFileType)}
                projectName={p.project?.name}
              />
            </ButtonGroup>
            {categories.map((category, i) => {
              return (
                <Box key={i} mb={4}>
                  <Heading size='lg' mb={1}>
                    {category}
                  </Heading>

                  <Grid
                    templateColumns='repeat(auto-fill, minmax(200px, 1fr))'
                    gap={2}
                  >
                    {files
                      ?.sort(sortFiles)
                      ?.filter((f) => filter(category, f))
                      ?.filter(filterFileType)
                      ?.map((file) => (
                        <FileCard
                          key={file.id}
                          id={file.id}
                          filename={file.name}
                          size={file.size}
                          mimeType={file.mimeType}
                          createdAt={file.createdAt}
                          caption={file.caption ?? undefined}
                          fileUrl={file.signedUrl}
                          thumbnailUrl={file.thumbnail ?? undefined}
                          blurhash={file.blurhash ?? undefined}
                          duration={file.duration ?? undefined}
                          onDownloadClicked={() => onDownloadClicked(file)}
                          onGoToNoteClicked={() => onGoToNoteClicked(file)}
                          onClick={() => setIndexToView(files?.indexOf(file))}
                          noteTitle={file.note?.title}
                        />
                      ))}
                  </Grid>
                </Box>
              )
            })}
          </>
        ) : (
          <Center p={8}>
            <Text opacity={0.5}>No attachments were found</Text>
          </Center>
        )}
      </ContentBox>
      <MediaViewer
        setSelectedIndex={setIndexToView}
        selectedIndex={indexToView}
        media={
          files?.map((f) => ({
            filename: f.name,
            mimeType: f.mimeType,
            url: f.signedUrl,
            caption: f.caption,
          })) || []
        }
      />
    </>
  )
}

export default ProjectFiles
