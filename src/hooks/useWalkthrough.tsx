import {
  createContext,
  FC,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Text,
} from '@chakra-ui/react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { api } from 'utils/api'
import { DOCUMENT_WIDTH } from 'components/common/PageDocument'

type Step = {
  key: string
  title: string
  description: string
  disableNextButton?: boolean
  location: string
  hideArrow?: boolean
  asPortal?: boolean
}

type State = {
  currentStep?: Step
  currentStepIndex: number
  nextStep: (projectHandle?: string, noteHandle?: string) => void
  totalSteps: number
  walktroughVisible: boolean
  startWalkthrough: () => void
  finishWalkthrough: () => void
}

const defaultValue: State = {
  currentStep: {
    key: '',
    title: '',
    description: '',
    location: '/projects',
  },
  currentStepIndex: 0,
  nextStep: () => null,
  totalSteps: 0,
  walktroughVisible: false,
  startWalkthrough: () => null,
  finishWalkthrough: () => null,
}

type WalkthroughState = {
  currentStepIndex: number
  setCurrentStepIndex: (index: number) => void
  projectHandle: string
  setProjectHandle: (handle: string) => void
  noteHandle: string
  setNoteHandle: (handle: string) => void
}

const useWalkthroughStore = create<WalkthroughState>()(
  devtools(
    persist(
      (set) => ({
        currentStepIndex: 0,
        setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
        projectHandle: '',
        setProjectHandle: (handle) => set({ projectHandle: handle }),
        noteHandle: '',
        setNoteHandle: (handle) => set({ noteHandle: handle }),
      }),
      {
        name: 'walkthrough',
      },
    ),
  ),
)

export const WalkthroughContext = createContext<State>(defaultValue)
export const useWalkthrough = (): State => useContext(WalkthroughContext)

type WalkthroughProviderProps = {
  children: ReactElement
}

export const WalkthroughProvider: FC<WalkthroughProviderProps> = (p) => {
  const {
    currentStepIndex,
    setCurrentStepIndex,
    projectHandle,
    setProjectHandle,
    noteHandle,
    setNoteHandle,
  } = useWalkthroughStore()
  const [walktroughVisible, setWalktroughVisible] = useState(false)
  const { asPath, push } = useRouter()

  const { data: me } = api.me.me.useQuery()
  const updateDidSeeWalkthrough = api.me.didSeeWalkthrough.useMutation()

  const didSeeWalkthrough = me?.didSeeWalkthrough

  useEffect(() => {
    if (me && !didSeeWalkthrough) {
      startWalkthrough()
    }
  }, [didSeeWalkthrough, me])

  const steps = [
    {
      key: 'newProject',
      title: 'New Project',
      description:
        'Welcome to Ethnote. This walkthrough will take you through Ethnote\'s features. Click on "New Project" to create you first project',
      disableNextButton: true,
      location: '/projects',
    },
    {
      key: 'nameProject',
      title: 'Name Project',
      description:
        'Enter the name and a description of your project. Click on "Create Project" to continue.',
      disableNextButton: true,
      location: '/projects',
      hideArrow: true,
    },
    {
      key: 'noteTemplate',
      title: 'Note Template',
      description:
        'Within your project you can have different note templates. These templates constitute the structure of each note produced in your project. On this page, you design the template(s) you wish to use for your project.',
      location: '/projects/[projectHandle]/template',
    },
    {
      key: 'addContextBox',
      title: 'Add Context Box',
      description:
        'Adding context boxes to your templates ensures that your team always collects a specific kind of information in the same format. Click on "+" to add a new context box.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/template',
    },
    {
      key: 'addContextBox2',
      title: 'Save Context Box',
      description:
        'Enter a name and choose the type of contextual data you wish to collect. You can select between "Time", "Location", "Shared Tags", "Meta Text" or Note Information. Click on the checkmark to save and continue.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/template',
      hideArrow: true,
    },
    {
      key: 'addTextBox',
      title: 'Add Text Box',
      disableNextButton: true,
      description:
        'By default, you always have a text box in your note template. To add additional text boxes, click on "+".',
      location: '/projects/[projectHandle]/template',
    },
    {
      key: 'saveTextBox',
      title: 'Save Text Box',
      description:
        'Enter a name and specify instructions (if relevant) for the text box. Click on the checkmark to save and continue.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/template',
      hideArrow: true,
    },
    {
      key: 'saveTemplates',
      title: 'Save Templates',
      description:
        'When you have designed and adjusted the note template(s) you need in you project click on “Save templates” to continue.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/template',
    },
    {
      key: 'notes',
      title: 'Go To Note',
      description:
        'You are now ready to start producing notes! Click on “Notes” to go to your note overview.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/template',
    },
    {
      key: 'newNote',
      title: 'New Note',
      description:
        'Once you have started producing your notes, you will have a plethora of features to explore. First, you must create your first note. Click on “New Note” to create a new note.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/notes',
    },
    {
      key: 'noteName',
      title: 'Give Your Note A Name',
      description:
        'Enter a name for your note. Click "Create Note" to continue. If you have multiple templates, this is where you choose which template to produce the given note in.',
      disableNextButton: true,
      location: '/projects/[projectHandle]/notes',
      hideArrow: true,
    },
    {
      key: 'noteInfo',
      title: 'Note Info',
      description:
        'This section automatically logs meta data related to your note. Here you can edit the name of your note.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'contextArea',
      title: 'Context',
      description:
        'This section contains the context boxes you created in your note template. When you fill out a context box, the data is automatically saved.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'textArea',
      title: 'Text',
      description:
        'This section is where you produce your notes. All text is saved automatically. If you are offline, you can go to "Quick Notes" to produce your notes.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'autoTimestamp',
      title: 'Automatic Timestamp',
      description:
        'Now for some of the note features. By enabling automatic timestamp, a timestamp of the current time will automatically appear in the note. The feature activates when you press [enter] twice.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'addTimestamp',
      title: 'Add Timestamp',
      description:
        'You can also add timestamps of the current time manually by clicking on this button.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'hashtags',
      title: 'Add Hashtags',
      description:
        'You can add hashtags to your notes by clicking on this button or using the # symbol on your device keyboard. Hashtags can be used to highlight themes, keywords, or other notable things and are created across team members.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'mentions',
      title: 'Add Mentions',
      description:
        'You can mention people by clicking on this button or using the @ symbol. Mentions can be used to tag central interlocutors, fellow team members, other central figures or other usages you think of.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'annotations',
      title: 'Annotations',
      description:
        'You can highlight parts of the text by marking text and clicking on this button or by adding the corresponding symbols manually. Here asterisk (*) are defined to highlight analytical comments whereas quotes (“) are defined to highlights direct quotes. You can define your own annotations in settings.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
      asPortal: true,
    },
    {
      key: 'history',
      title: 'History',
      description:
        'Aside from the automatic saving, a snapshot of your note is saved every 5 minutes. Click on this button to view the backup history which showcase and thus the changes you have made since last snapshot was taken.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'attachments',
      title: 'Attachments',
      description:
        'In this section you can upload images, audio files or pdf documents to you notes. You can edit the name and provide each a caption.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
    {
      key: 'comments',
      title: 'Comments',
      description:
        'In this section, you and your team members can add comments to the note. If you tag team members by using the @ symbol they will be notified under "Notifications" and vice versa.',
      location: '/projects/[projectHandle]/notes/[noteHandle]',
    },
  ] as Step[]

  const nextStep = (projectHandle?: string, noteHandle?: string) => {
    projectHandle &&
      steps[currentStepIndex]?.key === 'nameProject' &&
      setProjectHandle(projectHandle)
    noteHandle &&
      steps[currentStepIndex]?.key === 'noteName' &&
      setNoteHandle(noteHandle)

    const next = currentStepIndex + 1
    if (next >= steps.length) {
      finishWalkthrough()
      return
    }
    setCurrentStepIndex(next)
  }

  const startWalkthrough = () => {
    setCurrentStepIndex(0)
    setWalktroughVisible(true)
    push('/projects')
  }

  const finishWalkthrough = () => {
    setWalktroughVisible(false)
    updateDidSeeWalkthrough.mutate()
  }

  const overlayVisible = walktroughVisible && currentStepIndex < steps.length
  const correctCurrentLocation = steps[currentStepIndex]?.location
    .replace('[projectHandle]', projectHandle)
    .replace('[noteHandle]', noteHandle)
  const isOnCorrectPage = correctCurrentLocation === asPath

  return (
    <WalkthroughContext.Provider
      value={{
        currentStep: steps[currentStepIndex],
        currentStepIndex,
        nextStep,
        totalSteps: Object.keys(steps).length,
        walktroughVisible,
        startWalkthrough,
        finishWalkthrough,
      }}
    >
      {p.children}
      {overlayVisible && (
        <>
          <Box
            pointerEvents='none'
            position='absolute'
            top={0}
            bottom={0}
            left={0}
            right={0}
            bg='#00000030'
          />
          <Flex
            left={0}
            right={0}
            bottom={0}
            bg='blue.500'
            position='fixed'
            alignItems='center'
            py={2}
          >
            <Container maxWidth={DOCUMENT_WIDTH}>
              <Flex
                gap={2}
                alignItems='center'
                justifyContent='space-between'
                flexWrap='wrap'
              >
                <Text>
                  Tutorial Active: <b>{steps[currentStepIndex]?.title}</b>
                </Text>
                <ButtonGroup size='sm' flexWrap='wrap'>
                  {!isOnCorrectPage && correctCurrentLocation && (
                    <Button
                      colorScheme='orange'
                      onClick={() => {
                        push(correctCurrentLocation)
                      }}
                    >
                      Continue on {correctCurrentLocation}
                    </Button>
                  )}
                  {currentStepIndex !== 0 && (
                    <Button
                      onClick={() => {
                        setCurrentStepIndex(currentStepIndex - 1)
                      }}
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      nextStep()
                    }}
                  >
                    Skip
                  </Button>
                  <Button onClick={finishWalkthrough}>Close tutorial</Button>
                </ButtonGroup>
              </Flex>
            </Container>
          </Flex>
        </>
      )}
    </WalkthroughContext.Provider>
  )
}
