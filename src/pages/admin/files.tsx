import { FC, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Button,
  ButtonGroup,
  Flex,
  Grid,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react'
import { filesize } from 'filesize'
import { capitalize, truncate } from 'lodash'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { AiOutlineArrowRight } from 'react-icons/ai'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'
import InfiniteScroll from 'react-infinite-scroll-component'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { toFileSize } from 'utils/toFilesize'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useConfirm } from 'hooks/useConfirm'
import { useStyle } from 'hooks/useStyle'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import {
  ContentBox,
  EasyTable,
  FileCard,
  ItemIsLocked,
  MediaViewer,
  PageDocument,
  Stat,
} from 'components'
import { TableColumn } from '../../components/common/EasyTable'

const Files: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { push } = useRouter()
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const { buttonBg } = useStyle()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [indexToView, setIndexToView] = useState<number>()
  const { isSuperAdminKeyValid, superAdminKey } = useSuperAdminKey()

  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.superAdmin.allFiles.useInfiniteQuery(
      {
        limit: 30,
        superAdminKey,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        enabled: isSuperAdminKeyValid,
      },
    )

  const deleteFile = api.superAdmin.deleteFile.useMutation({
    onSettled() {
      utils.superAdmin.allFiles.invalidate()
    },
  })

  const allFiles = data?.pages
    .flatMap((page) => page.files)
    .map((u) => ({
      id: u.id,
      name: u.name,
      createdAt: u.createdAt,
      size: u.size,
      mimeType: u.mimeType,
      noteHandle: u.note?.handle,
      projectHandle: u.note?.project?.handle,
      signedUrl: u.signedUrl,
      thumbnail: u.thumbnail,
      blurhash: u.blurhash,
    }))

  type AdminAllFile = NonNullable<typeof allFiles>[0]

  const columns = [
    {
      key: 'name',
      title: 'File Name',
      render: (value) => truncate(`${value}`, { length: 50 }),
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value) => moment(value).fromNow(),
    },
    {
      key: 'size',
      title: 'Size',
      render: (value) =>
        filesize(typeof value === 'number' ? value : 0, {
          base: 2,
          standard: 'jedec',
        }).toString(),
    },
    {
      key: 'mimeType',
      title: 'Mime Type',
      render: (value) => value,
    },
    {
      render: (_, allValues) => <EditButton row={allValues} />,
    },
  ] as TableColumn<AdminAllFile>[]

  const totalAmountOfFiles = data?.pages[0]?.fileCount ?? 0
  const totalAmountOfFilesLastWeek = data?.pages[0]?.fileCountLastWeek ?? 0
  const totalFileSize = data?.pages[0]?.totalFileSize._sum.size ?? 0
  const totalFileSizeLastWeek =
    data?.pages[0]?.totalFileSizeLastWeek._sum.size ?? 0
  const totalImageCount = data?.pages[0]?.imageCount ?? 0
  const totalVideoCount = data?.pages[0]?.videoCount ?? 0
  const totalPDFCount = data?.pages[0]?.PDFCount ?? 0
  const totalAudiCount = data?.pages[0]?.audioCount ?? 0
  const totalOtherCount =
    totalAmountOfFiles -
    totalImageCount -
    totalVideoCount -
    totalPDFCount -
    totalAudiCount

  const onDeleteClicked = (fileId: string) => {
    confirm({
      title: 'Delete note',
      message: 'Are you sure you want to delete this file?',
      isDanger: true,
      confirmText: 'Delete',
      textToEnableConfirm: 'DELETE',
      onConfirm: () =>
        deleteFile.mutate({
          fileId,
        }),
    })
  }

  const onGoToNoteClicked = (file: NonNullable<typeof allFiles>[0]) => {
    push(`/projects/${file.projectHandle}/notes/${file.noteHandle}`)
  }

  const EditButton = ({ row }: { row: AdminAllFile }) => {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={'Edit'}
          ml={2}
          variant='ghost'
          icon={<BsThreeDotsVertical />}
          size='sm'
          my={-1.5}
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
        <Portal>
          <MenuList>
            <MenuItem
              icon={<AiOutlineArrowRight />}
              onClick={(e) => {
                e.stopPropagation()
                push(`/projects/${row.projectHandle}/notes/${row.noteHandle}`)
              }}
            >
              Go to note
            </MenuItem>
            <MenuItem
              icon={<BsTrash />}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClicked(row.id)
              }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    )
  }
  return (
    <AuthenticatedLayout session={session} pageTitle={'Files | Admin'}>
      <PageDocument extraWide header={'Files'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              <Flex gap={8}>
                <Stat
                  label='Total amount of files'
                  value={totalAmountOfFiles}
                  prevNumber={totalAmountOfFilesLastWeek}
                  isLoading={isLoading}
                />
                <Stat
                  label='Total Size of Files'
                  value={totalFileSize}
                  prevNumber={totalFileSizeLastWeek}
                  isLoading={isLoading}
                  formatter={toFileSize}
                />
                <Stat
                  label='Images'
                  value={totalImageCount}
                  isLoading={isLoading}
                />
                <Stat
                  label='Videos'
                  value={totalVideoCount}
                  isLoading={isLoading}
                />
                <Stat
                  label='PDFs'
                  value={totalPDFCount}
                  isLoading={isLoading}
                />
                <Stat
                  label='Audio Files'
                  value={totalAudiCount}
                  isLoading={isLoading}
                />
                <Stat
                  label='Other Files'
                  value={totalOtherCount}
                  isLoading={isLoading}
                />
              </Flex>
            </ContentBox>
            <ContentBox>
              <ButtonGroup isAttached variant='outline' mb={4}>
                {(['list', 'grid'] as const).map((v, i) => (
                  <Button
                    key={i}
                    bg={viewMode === v ? buttonBg : undefined}
                    onClick={() => setViewMode(v)}
                  >
                    {capitalize(v)}
                  </Button>
                ))}
              </ButtonGroup>
              {viewMode === 'list' ? (
                <EasyTable<AdminAllFile>
                  data={allFiles ?? []}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  columns={columns}
                  size='sm'
                  isLoading={isLoading}
                />
              ) : (
                <InfiniteScroll
                  dataLength={allFiles?.length || 0}
                  next={() => fetchNextPage?.()}
                  hasMore={!!hasNextPage}
                  loader={<h4>Loading...</h4>}
                  style={{ overflow: 'unset' }}
                >
                  <Grid
                    templateColumns='repeat(auto-fill, minmax(200px, 1fr))'
                    gap={2}
                  >
                    {allFiles?.map((file, i) => (
                      <FileCard
                        key={file.id}
                        id={file.id}
                        filename={file.name}
                        size={file.size}
                        mimeType={file.mimeType}
                        createdAt={file.createdAt}
                        onDeleteClicked={() => onDeleteClicked(file.id)}
                        onGoToNoteClicked={() => onGoToNoteClicked(file)}
                        fileUrl={file.signedUrl}
                        thumbnailUrl={file.thumbnail ?? undefined}
                        blurhash={file.blurhash ?? undefined}
                        onClick={() => setIndexToView(i)}
                      />
                    ))}
                  </Grid>
                </InfiniteScroll>
              )}
            </ContentBox>
          </>
        )}
      </PageDocument>
      <MediaViewer
        setSelectedIndex={setIndexToView}
        selectedIndex={indexToView}
        media={
          allFiles?.map((f) => ({
            filename: f.name,
            mimeType: f.mimeType,
            url: f.signedUrl,
          })) || []
        }
      />
    </AuthenticatedLayout>
  )
}

export default Files
