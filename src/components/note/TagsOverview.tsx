import { FC, useState } from 'react'
import { Box, Button, ButtonGroup, Flex, IconButton } from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { AiOutlineHighlight } from 'react-icons/ai'
import { FaAsterisk } from 'react-icons/fa'
import { HiOutlineHashtag } from 'react-icons/hi'
import { MdOutlineAlternateEmail } from 'react-icons/md'
import { AppRouter } from 'server/api/root'

import { useGlobalState } from 'hooks/useGlobalState'
import { useStyle } from 'hooks/useStyle'
import { AnnotationList, ContentBox } from 'components'
import ProjectHashtags from 'components/note/hashtags'
import HashtagsWithContext from 'components/note/hashtagsWithContext'
import ProjectMentions from 'components/note/mentions'
import MentionsWithContext from 'components/note/mentionsWithContext'

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const TagsOverview: FC<Props> = (p) => {
  const [activeView, setActiveView] = useState<
    'Hashtags' | 'Mentions' | 'Annotations'
  >('Hashtags')
  const { isSmallScreen } = useGlobalState()
  const { hoverBg } = useStyle()

  return (
    <Box>
      <ContentBox>
        <Flex
          gap={2}
          flexDir={isSmallScreen ? 'column' : 'row'}
          w={isSmallScreen ? '100%' : undefined}
        >
          <ButtonGroup isAttached>
            {(
              [
                { view: 'Hashtags', icon: <HiOutlineHashtag /> },
                { view: 'Mentions', icon: <MdOutlineAlternateEmail /> },
                { view: 'Annotations', icon: <AiOutlineHighlight /> },
              ] as const
            ).map(({ view, icon }, i) => (
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
        </Flex>
        {activeView === 'Hashtags' && (
          <>
            <ProjectHashtags
              project={p.project}
              visibleNotes={p.visibleNotes}
            />
            <HashtagsWithContext
              project={p.project}
              visibleNotes={p.visibleNotes}
            />
          </>
        )}
        {activeView === 'Mentions' && (
          <>
            <ProjectMentions
              project={p.project}
              visibleNotes={p.visibleNotes}
            />
            <MentionsWithContext
              project={p.project}
              visibleNotes={p.visibleNotes}
            />
          </>
        )}
        {activeView === 'Annotations' && (
          <>
            <AnnotationList project={p.project} visibleNotes={p.visibleNotes} />
          </>
        )}
      </ContentBox>
    </Box>
  )
}

export default TagsOverview
