import { FC } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react'
import { filesize } from 'filesize'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { BsThreeDotsVertical, BsTrash } from 'react-icons/bs'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useConfirm } from 'hooks/useConfirm'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import {
  ContentBox,
  EasyTable,
  ItemIsLocked,
  PageDocument,
  Stat,
} from 'components'
import { TableColumn } from '../../components/common/EasyTable'

const Notes: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const { push } = useRouter()
  const { confirm } = useConfirm()
  const utils = api.useContext()
  const { isSuperAdminKeyValid, superAdminKey } = useSuperAdminKey()

  const { data, fetchNextPage, hasNextPage, isLoading } =
    api.superAdmin.allNotes.useInfiniteQuery(
      {
        limit: 30,
        superAdminKey,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        enabled: isSuperAdminKeyValid,
      },
    )
  const deleteNote = api.superAdmin.deleteNote.useMutation({
    onSettled() {
      utils.superAdmin.allNotes.invalidate()
    },
  })

  const allNotes = data?.pages
    .flatMap((page) => page.notes)
    .map((u) => ({
      id: u.id,
      title: u.title,
      createdAt: u.createdAt,
      authorName: u.author?.fullName,
      authorEmail: u.author?.email,
      fileCount: u._count?.files,
      commentCount: u._count?.comments,
      totalFileSize: u.totalFileSize,
      projectHandle: u.project?.handle,
      noteHandle: u.handle,
    }))

  type AdminAllNote = NonNullable<typeof allNotes>[0]

  const columns = [
    {
      key: 'title',
      title: 'Title',
      render: (value) => value,
    },
    {
      key: 'createdAt',
      title: 'Created',
      render: (value) => moment(value).fromNow(),
    },
    {
      key: 'fileCount',
      title: '# of files',
      render: (value) => value,
    },
    {
      key: 'totalFileSize',
      title: 'Total size of files',
      render: (value) =>
        filesize(typeof value === 'number' ? value : 0, {
          base: 2,
          standard: 'jedec',
        }).toString(),
    },
    {
      key: 'commentCount',
      title: '# of comments',
      render: (value) => value,
    },
    {
      key: 'authorName',
      title: 'Author Name',
      render: (value) => value,
    },
    {
      key: 'authorEmail',
      title: 'Author Email',
      render: (value) => value,
    },
    {
      render: (_, allValues) => <EditButton noteId={allValues.id} />,
    },
  ] as TableColumn<AdminAllNote>[]

  const totalAmountOfFieldNotes = data?.pages[0]?.noteCount ?? 0
  const totalAmountOfFieldNotesLastWeek = data?.pages[0]?.noteCountLastWeek ?? 0

  const onDeleteClicked = (noteId: string) => {
    confirm({
      title: 'Delete note',
      message: 'Are you sure you want to delete this note?',
      isDanger: true,
      confirmText: 'Delete',
      textToEnableConfirm: 'DELETE',
      onConfirm: () =>
        deleteNote.mutate({
          noteId,
        }),
    })
  }

  const EditButton = ({ noteId }: { noteId: string }) => {
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
              icon={<BsTrash />}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteClicked(noteId)
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
    <AuthenticatedLayout session={session} pageTitle={'Notes | Admin'}>
      <PageDocument extraWide header={'Notes'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              <Stat
                label='Total amount of notes'
                value={totalAmountOfFieldNotes}
                prevNumber={totalAmountOfFieldNotesLastWeek}
                isLoading={isLoading}
              />
            </ContentBox>
            <ContentBox>
              <EasyTable<AdminAllNote>
                data={allNotes ?? []}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                columns={columns}
                size='sm'
                isLoading={isLoading}
                onRowClick={(row) => {
                  push(`/projects/${row.projectHandle}/notes/${row.noteHandle}`)
                }}
              />
            </ContentBox>
          </>
        )}
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default Notes
