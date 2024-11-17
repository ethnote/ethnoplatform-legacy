import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tag,
  Text,
} from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { BORDER_RADIUS } from 'constants/constants'
import moment from 'moment'
import { AiOutlineCloudDownload } from 'react-icons/ai'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { AppRouter } from 'server/api/root'

import { api } from 'utils/api'
import { getHashtagsWithContext } from 'utils/hashtagsWithContext'
import { getLinkWrapper, makeCSVFriendly } from 'utils/textDownloadWrapper'
import { useGlobalState } from 'hooks/useGlobalState'
import { ContentBox } from 'components'

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const HashtagsWithContext: FC<Props> = (p) => {
  const { query } = useRouter()
  const [sentencesToInclude, setSentencesToInclude] =
    useState<Record<string, number>>()
  const [hashtagsToExport, setHashtagsToExport] = useState<string[]>([])
  const [minSentences, setMinSentences] = useState(1)
  const { isSmallScreen } = useGlobalState()

  const hashtagsWithNotes = getHashtagsWithContext({
    sentencesToInclude,
    visibleNotes: p.visibleNotes,
    minSentences,
  })

  const convertToDocx = api.project.convertToDocx.useMutation()
  const convertToXlsx = api.project.convertToXlsx.useMutation()

  const LeftRightButtons = ({
    onLeftClick,
    onRightClick,
    leftDisabled,
    rightDisabled,
    ml,
    mr,
  }: {
    onLeftClick: () => void
    onRightClick: () => void
    leftDisabled?: boolean
    rightDisabled?: boolean
    ml?: number
    mr?: number
  }) => {
    return (
      <ButtonGroup
        size='xs'
        isAttached
        variant='ghost'
        display='inline'
        ml={ml}
        mr={mr}
      >
        <IconButton
          onClick={onLeftClick}
          aria-label='left'
          icon={<BsChevronLeft />}
          isDisabled={leftDisabled}
          transform='translateY(-1px)'
        />
        <IconButton
          onClick={onRightClick}
          aria-label='right'
          icon={<BsChevronRight />}
          isDisabled={rightDisabled}
          transform='translateY(-1px)'
        />
      </ButtonGroup>
    )
  }

  const allSelected = hashtagsToExport?.length === hashtagsWithNotes?.length

  const deselectAll = () => {
    setHashtagsToExport([])
  }
  const selectAll = () => {
    setHashtagsToExport(hashtagsWithNotes?.map((x) => x.hashtag))
  }

  const SelectAllButton = () => {
    return (
      <Button
        variant='outline'
        onClick={allSelected ? deselectAll : selectAll}
        isDisabled={!hashtagsWithNotes?.length}
        aria-label={'Select'}
      >
        {allSelected ? 'Deselect all' : 'Select all'}
      </Button>
    )
  }

  const toBeExported = hashtagsWithNotes
    .map((x) => ({
      hashtag: x.hashtag,
      count: x.count,
      usedIn: x.hashTagsInNote.map((n) => ({
        // noteId: n?.note.id,
        noteTitle: n?.note.title,
        // noteFieldId: n?.noteField.id,
        noteFieldName: n?.noteField.name,
        // authorEmail: n?.note.author?.email,
        authorFullName: n?.note.author?.fullName,
        context: n?.leftText + '#' + x.hashtag + n?.rightText,
      })),
    }))
    .filter(({ hashtag }) => hashtagsToExport.includes(hashtag))

  const exportFilename =
    `${p.project?.name?.toLocaleLowerCase()}_hashtags_${moment().format(
      'DD_MM_YYYY',
    )}`.replace(/ /g, '_')

  const downloadAsJson = () => {
    const href = getLinkWrapper('json')(JSON.stringify(toBeExported, null, 2))

    const link = document.createElement('a')
    link.href = href
    link.download = `${exportFilename}.json`

    link.click()
  }

  const downloadAsCsv = () => {
    const asCsv =
      'hashtag,authorFullName,noteTitle,context\n' +
      toBeExported
        .flatMap((h) =>
          h.usedIn.map(
            (n) =>
              `${makeCSVFriendly(h.hashtag)},${makeCSVFriendly(
                n.authorFullName || '',
              )},${makeCSVFriendly(n.noteTitle || '')},${makeCSVFriendly(
                n.context,
              )}`,
          ),
        )
        .join('\n')
    const href = getLinkWrapper('csv')(asCsv)

    const link = document.createElement('a')
    link.href = href
    link.download = `${exportFilename}.csv`

    link.click()
  }

  const exportStringAsLines = () =>
    toBeExported
      .map((h) => {
        return (
          `#${h.hashtag} (${h.count})\n\n` +
          h.usedIn
            .map(
              (n) =>
                `Author name: ${n.authorFullName}
Note title: ${n.noteTitle}
Field name: ${n.noteFieldName}
Context: ${n.context}\n`,
            )
            .join('\n')
        )
      })
      .join('______________\n\n')

  const downloadAsDocx = async () => {
    const asDocx = await convertToDocx.mutateAsync({
      paragraphs: exportStringAsLines().split('\n'),
    })

    const href = getLinkWrapper('docx')(asDocx)

    const link = document.createElement('a')
    link.href = href
    link.download = `${exportFilename}.docx`

    link.click()
  }

  const downloadAsXlsx = async () => {
    const grid = [
      ['hashtag', 'context', 'authorFullName'],
      ...toBeExported.flatMap((h) =>
        h.usedIn.map((n) => [
          h.hashtag || '',
          n.context || '',
          n.authorFullName || '',
        ]),
      ),
    ]

    const asXlsx = await convertToXlsx.mutateAsync({
      grid,
    })

    const href = getLinkWrapper('xlsx')(asXlsx)

    const link = document.createElement('a')
    link.href = href
    link.download = `${exportFilename}.xlsx`

    link.click()
  }

  const downloadAsTxt = () => {
    const asTxt = exportStringAsLines()
    const href = getLinkWrapper('txt')(asTxt)

    const link = document.createElement('a')
    link.href = href
    link.download = `${exportFilename}.txt`

    link.click()
  }

  const downloadOptions = [
    {
      label: '.docx (Word)',
      onClick: downloadAsDocx,
    },
    {
      label: '.xlsx (Excel)',
      onClick: downloadAsXlsx,
    },
    {
      label: '.csv',
      onClick: downloadAsCsv,
    },
    {
      label: '.json',
      onClick: downloadAsJson,
    },
    {
      label: '.txt (Raw Text)',
      onClick: downloadAsTxt,
    },
  ]

  const adjustContextToInclude = (amount: number) => {
    setMinSentences((prev) => Math.max(1, prev + amount))
  }

  const DownloadButton = () => {
    return (
      <Menu>
        <MenuButton
          as={isSmallScreen ? IconButton : Button}
          fontWeight='normal'
          {...(!isSmallScreen ? { leftIcon: <AiOutlineCloudDownload /> } : {})}
          {...(isSmallScreen ? { icon: <AiOutlineCloudDownload /> } : {})}
          variant='outline'
          isDisabled={!hashtagsToExport?.length}
        >
          Download Selected
        </MenuButton>
        <Portal>
          <MenuList>
            {downloadOptions.map((o, i) => (
              <MenuItem
                key={i}
                isDisabled={!hashtagsToExport?.length}
                onClick={o.onClick}
              >
                {o.label}
              </MenuItem>
            ))}
          </MenuList>
        </Portal>
      </Menu>
    )
  }

  return (
    <Box w='100%'>
      <Flex
        mb={4}
        mt={8}
        justifyContent='space-between'
        flexDir={{
          base: 'column',
          md: 'row',
        }}
        px={{
          base: 3,
          md: 0,
        }}
        alignItems={{ base: undefined, md: 'flex-end' }}
      >
        <Heading
          fontSize={20}
          mb={{
            base: 2,
            md: 0,
          }}
        >
          Hashtag Context
        </Heading>
        <ButtonGroup alignItems='center' variant='outline'>
          <Button onClick={() => adjustContextToInclude(-1)}>-1</Button>
          <Flex flexDir='column' alignItems='center'>
            <Text fontSize='sm'>Include {minSentences}</Text>
            <Text fontSize='sm' mt={-1}>
              sentence{minSentences !== 1 ? 's' : ''}
            </Text>
          </Flex>
          <Button onClick={() => adjustContextToInclude(1)}>+1</Button>
          <SelectAllButton />
          <DownloadButton />
        </ButtonGroup>
      </Flex>
      {hashtagsWithNotes.length > 0 ? (
        <Box>
          {hashtagsWithNotes.map(({ count, hashtag, hashTagsInNote }, i) => {
            return (
              <ContentBox
                key={i}
                bg='whiteAlpha.50'
                mb={i === hashtagsWithNotes.length - 1 ? 0 : 4}
                title={`#${hashtag} (${count})`}
                isMinimizable
                minimizeId={`${query.projectHandle}_${hashtag}`}
                inverseMinimize
                leftForTitle={
                  <Flex position='absolute' left={2} top={2} zIndex={1}>
                    <Checkbox
                      isChecked={hashtagsToExport?.includes(hashtag)}
                      onChange={() => {
                        if (hashtagsToExport?.includes(hashtag)) {
                          setHashtagsToExport(
                            (prev) => prev?.filter((x) => x !== hashtag),
                          )
                        } else {
                          setHashtagsToExport((prev) => [
                            ...(prev || []),
                            hashtag,
                          ])
                        }
                      }}
                    />
                  </Flex>
                }
              >
                {hashTagsInNote.map((elm, j) => {
                  const {
                    note,
                    noteField,
                    leftId,
                    rightId,
                    canLeftLeft,
                    canLeftRight,
                    canRightLeft,
                    canRightRight,
                    leftText,
                    rightText,
                  } = elm || {}

                  if (!note || !noteField || !leftId || !rightId) return null

                  return (
                    <Box key={j}>
                      <Link
                        key={note.id}
                        href={`/projects/${query.projectHandle}/notes/${note.handle}`}
                      >
                        <Button size='xs' variant='link' opacity={0.6}>
                          {note.author?.fullName ?? note.author?.email} /{' '}
                          {note.title} / {noteField.name}
                        </Button>
                      </Link>
                      <Box mb={2} borderRadius={BORDER_RADIUS}>
                        <Text>
                          <LeftRightButtons
                            onLeftClick={() => {
                              setSentencesToInclude((prev) => ({
                                ...prev,
                                [leftId]: (prev?.[leftId] ?? 1) + 1,
                              }))
                            }}
                            onRightClick={() => {
                              setSentencesToInclude((prev) => ({
                                ...prev,
                                [leftId]: (prev?.[leftId] ?? 1) - 1,
                              }))
                            }}
                            leftDisabled={!canLeftLeft}
                            rightDisabled={!canLeftRight}
                            mr={1}
                          />
                          <Text display='inline'>{leftText}</Text>
                          <Tag colorScheme='red'>#{hashtag}</Tag>
                          <Text display='inline'>{rightText}</Text>
                          <LeftRightButtons
                            onLeftClick={() => {
                              setSentencesToInclude((prev) => ({
                                ...prev,
                                [rightId]: (prev?.[rightId] ?? 1) - 1,
                              }))
                            }}
                            onRightClick={() => {
                              setSentencesToInclude((prev) => ({
                                ...prev,
                                [rightId]: (prev?.[rightId] ?? 1) + 1,
                              }))
                            }}
                            leftDisabled={!canRightLeft}
                            rightDisabled={!canRightRight}
                            ml={1}
                          />
                        </Text>
                      </Box>
                    </Box>
                  )
                })}
              </ContentBox>
            )
          })}
        </Box>
      ) : (
        <Center p={8}>
          <Text opacity={0.5}>No hashtags were found</Text>
        </Center>
      )}
    </Box>
  )
}

export default HashtagsWithContext
