import { useState } from 'react'
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Grid,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
} from '@chakra-ui/react'
import Fuse from 'fuse.js'
import { useSession } from 'next-auth/react'
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai'
import { IoCloudUploadOutline, IoDocumentOutline } from 'react-icons/io5'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useGlobalState } from 'hooks/useGlobalState'
import {
  ButtonVariant,
  ContentBox,
  ImportJsonModal,
  Invitations,
  NewProjectModal,
  PageDocument,
  ProjectCard,
  ProjectTransferInvitation,
  ProjectTransferWarning,
  SkeletonPlaceholder,
  Walkthrough,
} from 'components'

const Home: NextPage = () => {
  const { data: session } = useSession()
  const { data: me, isLoading } = api.me.me.useQuery()
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [searchWord, setSearchWord] = useState('')
  const [importJsonModalIsOpen, setImportJsonModalIsOpen] = useState(false)
  const { isSmallScreen } = useGlobalState()

  const { push } = useRouter()

  const projects = me?.projectMemberships?.flatMap((pm) => pm.project)

  const withFuzzySearch = (input: typeof projects): typeof projects => {
    if (!searchWord) {
      return input
    }

    const list =
      input?.map((project) => {
        return {
          id: project?.id,
          name: project?.name,
          description: project?.description,
        }
      }) || []

    const options = {
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      threshold: 0.4,
      keys: ['name', 'description'],
    } as Fuse.IFuseOptions<(typeof list)[0]>

    const fuse = new Fuse(list, options)
    const searchResult = fuse.search(searchWord.trim())

    return searchResult
      .map((result) => input?.find((p) => p?.id === result.item.id))
      .filter(Boolean) as typeof projects
  }

  const projectToShow = withFuzzySearch(projects)?.sort((a, b) =>
    !searchWord
      ? (b?.updatedAt as Date).getTime() - (a?.updatedAt as Date).getTime()
      : 0,
  )

  const shouldShowWelcomeMessage = projectToShow?.length === 0 && !searchWord

  if (!me || !session) {
    return (
      <AuthenticatedLayout session={session} pageTitle={'Home'}>
        <SkeletonPlaceholder withHeader w='1140px' />
        <Center>
          <Button variant='outline' onClick={() => push('/quick-notes')}>
            Go to quick notes
          </Button>
        </Center>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout
      isLoading={!me}
      session={session}
      pageTitle='My Projects'
    >
      <PageDocument isLoading={!me} header='My Projects'>
        <Invitations />
        <ContentBox>
          <Flex
            justifyContent='space-between'
            flexDir={{
              base: 'column',
              md: 'row',
            }}
          >
            <Heading mb={4} fontSize={20} textAlign={'left'}>
              Overview
            </Heading>
            <Flex
              flexDir={{
                base: 'column',
                md: 'row',
              }}
              gap={2}
            >
              <ButtonGroup isAttached>
                <Button
                  variant='outline'
                  w={{
                    base: '100%',
                    md: 'auto',
                  }}
                  py={5}
                  onClick={() => setImportJsonModalIsOpen(true)}
                  leftIcon={<IoCloudUploadOutline />}
                >
                  Import JSON
                </Button>
                <Button
                  variant='outline'
                  w={{
                    base: '100%',
                    md: 'auto',
                  }}
                  py={5}
                  onClick={() => push('/quick-notes')}
                  leftIcon={<IoDocumentOutline />}
                >
                  Quick notes
                </Button>
              </ButtonGroup>
              <Walkthrough stepKey='newProject'>
                {(nextStep) => (
                  <ButtonVariant
                    leftIcon={<AiOutlinePlus />}
                    variant='outline'
                    colorScheme='blue'
                    fullWidth={isSmallScreen}
                    onClick={() => {
                      setNewProjectModalOpen(true)
                      nextStep()
                    }}
                  >
                    New project
                  </ButtonVariant>
                )}
              </Walkthrough>
            </Flex>
          </Flex>
          {!shouldShowWelcomeMessage ? (
            <InputGroup mt={4}>
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
          ) : (
            <></>
          )}
          {me?.invitedToGetProjects?.map((invitation, i) => {
            return (
              <Box mt={4} key={i}>
                <ProjectTransferInvitation
                  id={invitation.id}
                  fromEmail={invitation.fromUser.email}
                />
              </Box>
            )
          })}
          {me?.projectTransferInvitations?.map((invitation, i) => {
            return (
              <Box mt={4} key={i}>
                <ProjectTransferWarning toEmail={invitation.toEmail} />
              </Box>
            )
          })}
          {!isLoading ? (
            <>
              <Box w='100%' mt={4}>
                <Grid
                  // templateColumns={{
                  //   base: 'repeat(1, minmax(0, 1fr))',
                  //   md: 'repeat(2, minmax(0, 1fr))',
                  //   lg: 'repeat(3, minmax(0, 1fr))',
                  // }}
                  templateColumns='repeat(auto-fill, minmax(300px, 1fr))'
                  gap={2}
                >
                  {projectToShow?.map((project, i) => {
                    if (!project) return null

                    const members =
                      project.projectMemberships.map((m) => ({
                        name: m.user?.fullName || undefined,
                        avatarHue: m.user?.avatarHue || undefined,
                      })) || []

                    const stats = [
                      {
                        label: 'Team Members',
                        value: members.length + '',
                      },
                      {
                        label: 'Notes',
                        value: project.notes?.length + '',
                      },
                      {
                        label: 'Attachments',
                        value:
                          project.notes?.flatMap((n) => n.files).length + '',
                      },
                    ]

                    return (
                      <ProjectCard
                        key={i}
                        onClick={() =>
                          push(`/projects/${project.handle}/notes`)
                        }
                        members={members}
                        createdAt={project.createdAt}
                        updatedAt={project.updatedAt}
                        title={project.name}
                        subtitle={project.description}
                        stats={stats}
                        searchWord={searchWord}
                        projectHandle={project.handle}
                      />
                    )
                  })}
                </Grid>
                {projectToShow?.length === 0 && (
                  <Box p={8} py={16}>
                    <Text opacity={0.8} textAlign='center'>
                      No projects found.{' '}
                      {(projects || []).length > 0
                        ? 'Try searching for something else.'
                        : 'Create a new project to get started.'}
                    </Text>
                  </Box>
                )}
                {/* {shouldShowWelcomeMessage && (
                  <Box p={8} py={16}>
                    <Text fontSize='lg' opacity={0.8} textAlign='center'>
                      Welcome to your project page! 👋 Here you can create and
                      manage your projects. Click on &rsquo;New Project&rsquo;
                      first project or ask your friends/colleagues to invite you
                      to their projects.
                      <br />
                      <br />
                      You can also write offline notes (found in the bottom of
                      the page).
                    </Text>
                  </Box>
                )} */}
              </Box>
            </>
          ) : (
            <Box mt={4}>
              <SkeletonPlaceholder />
            </Box>
          )}
        </ContentBox>
      </PageDocument>
      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
      />
      <ImportJsonModal
        isOpen={importJsonModalIsOpen}
        onClose={() => setImportJsonModalIsOpen(false)}
      />
    </AuthenticatedLayout>
  )
}

export default Home
