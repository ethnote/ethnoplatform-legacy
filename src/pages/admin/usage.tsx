import { FC, useState } from 'react'
import { NextPage } from 'next'
import {
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  Skeleton,
} from '@chakra-ui/react'
import moment from 'moment'
import { useSession } from 'next-auth/react'
import { AiOutlineFileImage } from 'react-icons/ai'
import { BsGrid } from 'react-icons/bs'
import { FiUsers } from 'react-icons/fi'
import { IoDocumentsOutline } from 'react-icons/io5'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { toFileSize } from 'utils/toFilesize'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useStyle } from 'hooks/useStyle'
import { ContentBox, LineChart, PageDocument, Stat } from 'components'

const AdminDashboard: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const [dayInterval, setDayInterval] = useState(1)
  const { buttonBg } = useStyle()

  const { data, isLoading } = api.superAdmin.allStats.useQuery({
    dayInterval,
  })

  // Users
  const totalAmountOfUsers = data?.userCount ?? 0
  const totalAmountOfUsersLastWeek = data?.userCountLastWeek ?? 0

  // Project
  const totalAmountOfProjects = data?.projectCount ?? 0
  const totalAmountOfProjectsLastWeek = data?.projectCountLastWeek ?? 0

  // Notes
  const totalAmountOfFieldNotes = data?.noteCount ?? 0
  const totalAmountOfFieldNotesLastWeek = data?.noteCountLastWeek ?? 0

  // Files
  const totalAmountOfFiles = data?.fileCount ?? 0
  const totalAmountOfFilesLastWeek = data?.fileCountLastWeek ?? 0
  const totalFileSize = data?.totalFileSize._sum.size ?? 0
  const totalFileSizeLastWeek = data?.totalFileSizeLastWeek?._sum?.size ?? 0
  const totalImageCount = data?.imageCount ?? 0
  const totalVideoCount = data?.videoCount ?? 0
  const totalPDFCount = data?.PDFCount ?? 0
  const totalAudiCount = data?.audioCount ?? 0
  const totalOtherCount =
    totalAmountOfFiles -
    totalImageCount -
    totalVideoCount -
    totalPDFCount -
    totalAudiCount

  const toDataSet = (values: number[] | undefined) =>
    values?.map((y, i) => ({
      y,
      x: moment()
        .subtract(i * dayInterval, 'day')
        .format('MMM D, YY'),
      delta: i === values.length - 1 ? 0 : y - (values[i + 1] || 0), // If it's the last item, delta is 0 because we don't want to include everything before that day
    })) ?? []

  return (
    <AuthenticatedLayout session={session} pageTitle={'Usage | Admin'}>
      <PageDocument extraWide header={'Usage'} tabs={tabs}>
        <ContentBox>
          <ButtonGroup isAttached variant='outline'>
            {[1, 3, 6, 12].map((v, i) => (
              <Button
                key={i}
                bg={dayInterval === v ? buttonBg : undefined}
                onClick={() => setDayInterval(v)}
              >
                {
                  {
                    1: '1 Month',
                    3: '3 Months',
                    6: '6 Months',
                    12: '12 Months',
                  }[v]
                }
              </Button>
            ))}
          </ButtonGroup>
        </ContentBox>
        <Grid
          templateColumns={{
            base: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
          }}
          gap={3}
        >
          <ContentBox mb={0}>
            <Flex gap={2}>
              <FiUsers size={20} />
              <Heading mb={4} fontSize={20}>
                Users
              </Heading>
            </Flex>
            <Stat
              label='Total amount of users'
              value={totalAmountOfUsers}
              prevNumber={totalAmountOfUsersLastWeek}
              isLoading={isLoading}
            />
            {!isLoading && (
              <LineChart
                data={toDataSet(data?.userCountLast30Days)}
                valueKey='Users'
              />
            )}
          </ContentBox>
          <ContentBox mb={0}>
            <Flex gap={2}>
              <BsGrid size={20} />
              <Heading mb={4} fontSize={20}>
                Projects
              </Heading>
            </Flex>
            <Stat
              label='Total amount of projects'
              value={totalAmountOfProjects}
              prevNumber={totalAmountOfProjectsLastWeek}
              isLoading={isLoading}
            />
            {!isLoading && (
              <LineChart
                data={toDataSet(data?.projectCountLast30Days)}
                valueKey='Projects'
              />
            )}
          </ContentBox>
          <ContentBox mb={0}>
            <Flex gap={2}>
              <IoDocumentsOutline size={20} />
              <Heading mb={4} fontSize={20}>
                Notes
              </Heading>
            </Flex>
            <Stat
              label='Total amount of notes'
              value={totalAmountOfFieldNotes}
              prevNumber={totalAmountOfFieldNotesLastWeek}
              isLoading={isLoading}
            />
            {!isLoading && (
              <LineChart
                data={toDataSet(data?.noteCountLast30Days)}
                valueKey='Notes'
              />
            )}
          </ContentBox>
          <ContentBox mb={0}>
            <Flex gap={2}>
              <AiOutlineFileImage size={20} />
              <Heading mb={4} fontSize={20}>
                Files
              </Heading>
            </Flex>
            <Skeleton isLoaded={!isLoading}>
              <Flex gap={4} flexWrap='wrap'>
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
                <Flex gap={4} flexWrap='wrap'></Flex>

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
            </Skeleton>

            {!isLoading && (
              <LineChart
                data={toDataSet(data?.fileCountLast30Days)}
                valueKey='Files'
              />
            )}
          </ContentBox>
        </Grid>
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default AdminDashboard
