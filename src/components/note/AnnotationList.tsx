import { FC, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Tag,
  Text,
} from '@chakra-ui/react'
import { inferRouterOutputs } from '@trpc/server'
import { DEFAULT_TEXT_EDITOR_HIGHLIGHT } from 'constants/constants'
import moment from 'moment'
import { AiOutlineCloudDownload } from 'react-icons/ai'
import { AppRouter } from 'server/api/root'
import { Descendant, Node } from 'slate'

import { api } from 'utils/api'
import { getLinkWrapper, makeCSVFriendly } from 'utils/textDownloadWrapper'
import { useGlobalState } from 'hooks/useGlobalState'
import ContentBox from 'components/common/ContentBox'
import { Highlight } from 'components/project/TextEditorCustomHighlight'

type Props = {
  project?: inferRouterOutputs<AppRouter>['project']['project']
  visibleNotes: NonNullable<
    inferRouterOutputs<AppRouter>['project']['project']
  >['notes']
}

const AnnotationList: FC<Props> = (p) => {
  const { query } = useRouter()
  const { isSmallScreen } = useGlobalState()
  const [annotationsToExport, setAnnotationsToExport] = useState<string[]>([])

  const convertToDocx = api.project.convertToDocx.useMutation()
  const convertToXlsx = api.project.convertToXlsx.useMutation()

  const annotations = (
    p.project?.textEditorHighlights?.length
      ? p.project?.textEditorHighlights
      : DEFAULT_TEXT_EDITOR_HIGHLIGHT
  ) as Highlight[]

  const getWordRegex = (char: string): RegExp => {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = `(${escapedChar}.*?${escapedChar})`
    return new RegExp(pattern, 'g')
  }

  const types = annotations.map((h) => ({
    ...h,
    type: h.name,
    regex: getWordRegex(h.symbol),
  }))

  type TokenType = {
    name: string
    color: string
    type: string
    regex: RegExp
  }

  type Content =
    | {
        content: string
        type: string
        name: string
        color: string
      }[]
    | null

  const matchRegex = (
    text: string,
    tokenTypes: TokenType[],
    level: number,
  ): Content => {
    if (level === tokenTypes.length) return null
    const { regex, name, color } = tokenTypes[level] as TokenType

    return text
      .split(regex)
      .flatMap((x) =>
        regex.test(x)
          ? { content: x, type: 'highlight', name, color } // only one level
          : matchRegex(x, tokenTypes, level + 1),
      )
      .filter(Boolean) as Content
  }

  const tokenize = (text: string) => {
    if (text === '') return null
    const tokens = matchRegex(
      text.replaceAll('”', '"').replaceAll('“', '"'),
      types,
      0,
    )
    return tokens?.filter(Boolean) as Content
  }

  const annotationsFromNotes = p.visibleNotes?.flatMap((note) =>
    note.noteFields.flatMap((field) => {
      const text = (field.content as unknown as Descendant[])
        ?.map((n) => Node.string(n))
        .join('\n')

      const tokens = tokenize(text)

      return {
        noteId: note.id,
        noteTitle: note.title,
        noteHandle: note.handle,
        authorName: note.author?.fullName,
        authorEmail: note.author?.email,
        noteFieldName: field.name,
        tokens,
      }
    }),
  )

  const annotatedTextByAnnotation = annotations.map((annotation) => ({
    annotation,
    annotatedTexts: annotationsFromNotes
      ?.filter(
        (a) =>
          a.tokens?.some(
            (t) => t.content.length > 0 && t.name === annotation.name,
          ),
      )
      ?.flatMap((a) => ({
        ...a,
        tokens: a.tokens?.filter((t) => t.name === annotation.name),
      })),
  }))

  const toBeExported = annotatedTextByAnnotation
    .map((x) => ({
      annotationName: x.annotation.name,
      count: x.annotatedTexts
        ?.flatMap((a) => a.tokens?.flatMap((t) => t.content))
        .filter(Boolean).length,
      usedIn: x.annotatedTexts?.map((a) => ({
        noteTitle: a.noteTitle,
        noteFieldName: a.noteFieldName,
        authorFullName: a.authorName,
        context: a.tokens?.map((t) => t.content).join('\n'),
      })),
    }))
    .filter(({ annotationName }) =>
      annotationsToExport.includes(annotationName),
    )

  const exportFilename =
    `${p.project?.name?.toLocaleLowerCase()}_annotations_${moment().format(
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
      'annotationName,authorFullName,noteTitle,context\n' +
      toBeExported
        .flatMap(
          (h) =>
            h.usedIn?.map(
              (n) =>
                `${makeCSVFriendly(h.annotationName)},${makeCSVFriendly(
                  n.authorFullName || '',
                )},${makeCSVFriendly(n.noteTitle || '')},${makeCSVFriendly(
                  n.context || '',
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
          `${h.annotationName} (${h.count})\n\n` +
          h.usedIn
            ?.map(
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
      ['annotationName', 'context', 'authorFullName'],
      ...toBeExported.flatMap(
        (e) =>
          e.usedIn?.map((n) => [
            e.annotationName || '',
            n.context || '',
            n.authorFullName || '',
          ]) || [],
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

  const DownloadButton = () => {
    return (
      <Menu>
        <MenuButton
          as={isSmallScreen ? IconButton : Button}
          fontWeight='normal'
          {...(!isSmallScreen ? { leftIcon: <AiOutlineCloudDownload /> } : {})}
          {...(isSmallScreen ? { icon: <AiOutlineCloudDownload /> } : {})}
          variant='outline'
          isDisabled={!annotationsToExport?.length}
        >
          Download Selected
        </MenuButton>
        <Portal>
          <MenuList>
            {downloadOptions.map((o, i) => (
              <MenuItem
                key={i}
                isDisabled={!annotationsToExport?.length}
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

  const allSelected = annotationsToExport?.length === annotations.length

  const selectAll = () => {
    setAnnotationsToExport(annotations.map((a) => a.name))
  }

  const deselectAll = () => {
    setAnnotationsToExport([])
  }

  const SelectAllButton = () => {
    return (
      <Button
        variant='outline'
        onClick={allSelected ? deselectAll : selectAll}
        isDisabled={
          !annotatedTextByAnnotation.flatMap((a) => a.annotatedTexts)?.length
        }
        aria-label={'Select'}
      >
        {allSelected ? 'Deselect all' : 'Select all'}
      </Button>
    )
  }

  return (
    <Box mt={6}>
      <Flex justifyContent='space-between' alignItems='center' mb={4}>
        <Heading fontSize={20}>Annotation Overview</Heading>
        <Flex gap={2}>
          <SelectAllButton />
          <DownloadButton />
        </Flex>
      </Flex>
      {annotatedTextByAnnotation?.map(({ annotation, annotatedTexts }, i) => {
        return (
          <ContentBox
            key={i}
            bg='whiteAlpha.50'
            mb={i === annotatedTextByAnnotation.length - 1 ? 0 : 4}
            title={`${annotation.name} (${annotatedTexts?.length})`}
            isMinimizable
            minimizeId={`${query.projectHandle}_${annotation.name}`}
            inverseMinimize
            leftForTitle={
              <Flex position='absolute' left={2} top={2} zIndex={1}>
                <Checkbox
                  isChecked={annotationsToExport?.includes(annotation.name)}
                  onChange={() => {
                    if (annotationsToExport?.includes(annotation.name)) {
                      setAnnotationsToExport(
                        (prev) => prev?.filter((x) => x !== annotation.name),
                      )
                    } else {
                      setAnnotationsToExport((prev) => [
                        ...(prev || []),
                        annotation.name,
                      ])
                    }
                  }}
                />
              </Flex>
            }
          >
            {annotatedTexts?.map((annotatedText, i) => (
              <Box key={i}>
                <Link
                  key={annotatedText.noteId}
                  href={`/projects/${query.projectHandle}/notes/${annotatedText.noteHandle}`}
                >
                  <Button size='xs' variant='link' opacity={0.6}>
                    {annotatedText.authorName ?? annotatedText.authorEmail} /{' '}
                    {annotatedText.noteTitle} / {annotatedText.noteFieldName}
                  </Button>
                </Link>
                {annotatedText.tokens?.map((token, i) => (
                  <Box>
                    <Tag
                      colorScheme={token.color}
                      key={i}
                      mb={2}
                      whiteSpace='normal'
                    >
                      {token.content}
                    </Tag>
                  </Box>
                ))}
              </Box>
            ))}
          </ContentBox>
        )
      })}
    </Box>
  )
}

export default AnnotationList
