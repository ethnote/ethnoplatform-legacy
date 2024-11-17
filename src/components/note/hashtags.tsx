import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
} from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { BORDER_RADIUS } from 'constants/constants'
import { truncate } from 'lodash'
import { AppRouter } from 'server/api/root'

import { useStyle } from 'hooks/useStyle'
import { Avatar } from 'components'

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const ProjectHashtags: FC<Props> = (p) => {
  const { query } = useRouter()
  const { bgMoreSemiTransparent } = useStyle()

  type HashtagEntity = {
    count: number
    notes: {
      id: string
      title: string
      author: string
      handle: string
      avatarHue?: number | undefined
    }[]
  }

  // Get hashtag count + which notes have that hashtag
  const hashtags = {} as Record<string, HashtagEntity>

  p.visibleNotes?.forEach((note) => {
    note.noteFields
      .filter((x) => x.isLatest)
      .forEach((noteField) => {
        noteField.hashtags?.forEach((hashtag) => {
          hashtags[hashtag] = {
            ...hashtags[hashtag],
            count: (hashtags[hashtag]?.count || 0) + 1,
            notes: [
              ...(hashtags[hashtag]?.notes || []),
              {
                id: note.id,
                title: note.title,
                author: note.author?.fullName || note.author?.email || '',
                handle: note.handle || '',
                avatarHue: note.author?.avatarHue ?? undefined,
              },
            ],
          }
        })
      })
  })

  const maxHashtagCount = Math.max(
    ...Object.keys(hashtags).map((hashtag) => hashtags[hashtag]?.count || 0),
  )

  const HashtagBlock = ({
    hashtag,
    notes,
  }: {
    hashtag: string
    notes: {
      id: string
      title: string
      author: string
      avatarHue?: number
      handle: string
    }[]
  }) => {
    const width = `${(notes.length / maxHashtagCount) * 100}%`

    const noteNamesWithHastagCount = notes.reduce(
      (acc, note) => {
        const noteNameCount = acc[note.id] || 0
        return {
          ...acc,
          [note.id]: noteNameCount + 1,
        }
      },
      {} as Record<string, number>,
    )

    return (
      <Flex position='relative' w='100%'>
        <Flex flexDir='column' zIndex={1} w='100%'>
          <Text as='h3' fontSize={20}>
            #{hashtag}{' '}
            <Text opacity={0.5} display='inline-block'>
              {notes.length}
            </Text>
          </Text>
          <Box
            w='100%'
            bg={bgMoreSemiTransparent}
            h={1}
            borderRadius={BORDER_RADIUS}
            mt={1}
          >
            <Box w={width} bg='blue.500' h={1} borderRadius={BORDER_RADIUS} />
          </Box>
          <Flex gap={1} mt={2} wrap='wrap'>
            {Object.keys(noteNamesWithHastagCount).map((noteId) => {
              const note = notes.find((x) => x.id === noteId)
              const count = noteNamesWithHastagCount[noteId]
              if (!note) return null

              return (
                <Link
                  key={note.id}
                  href={`/projects/${query.projectHandle}/notes/${note.handle}`}
                >
                  <Button
                    size='sm'
                    borderRadius='full'
                    variant='outline'
                    minW={0}
                    leftIcon={
                      <Avatar
                        name={note.author}
                        size='xs'
                        hue={note.avatarHue}
                      />
                    }
                    pl={1}
                  >
                    {truncate(note.title, {
                      length: 40,
                    })}
                    {(count || 0) > 1 ? ` (${count})` : ''}
                  </Button>
                </Link>
              )
            })}
          </Flex>
        </Flex>
      </Flex>
    )
  }

  const hashtagsWithCount = Object.keys(hashtags || {}).map((hashtag) => ({
    hashtag,
    count: hashtags[hashtag]?.count || 0,
  }))

  return (
    <>
      <Heading
        mb={2}
        mt={8}
        fontSize={20}
        px={{
          base: 4,
          md: 0,
        }}
      >
        Hashtag Overview
      </Heading>
      {hashtagsWithCount.length > 0 ? (
        <Grid
          mt={4}
          w='100%'
          gridTemplate={{
            base: 'repeat(1, 1fr) / repeat(1, 1fr)',
            md: 'repeat(1, 1fr) / repeat(2, 1fr)',
            lg: 'repeat(1, 1fr) / repeat(3, 1fr)',
          }}
          gap={4}
        >
          {hashtagsWithCount
            .sort((a, b) => b.count - a.count)
            .map(({ hashtag }, i) => {
              return (
                <GridItem
                  key={i}
                  colSpan={1}
                  minW={0}
                  borderRadius={BORDER_RADIUS}
                >
                  <HashtagBlock
                    hashtag={hashtag}
                    notes={hashtags[hashtag]?.notes || []}
                  />
                </GridItem>
              )
            })}
        </Grid>
      ) : (
        <Center p={8}>
          <Text opacity={0.5}>No hashtags were found</Text>
        </Center>
      )}
    </>
  )
}

export default ProjectHashtags
