import { inferRouterOutputs } from '@trpc/server'
import { AppRouter } from 'server/api/root'

type NoteParagraph = {
  type: 'paragraph'
  children: Array<{
    text?: string
    type?: 'mention' | 'mention'
    hashtag?: string
    mention?: string
    children?: Array<{
      text?: string
    }>
  }>
}

type VisibleNotes = NonNullable<
  inferRouterOutputs<AppRouter>['project']['project']
>['notes']

type GetMentionsWithContextProps = {
  sentencesToInclude: Record<string, number> | undefined
  visibleNotes: VisibleNotes
  minSentences?: number
}

type Note = NonNullable<VisibleNotes>[0]

export const getMentionsWithContext = (p: GetMentionsWithContextProps) => {
  const mentions = p.visibleNotes?.reduce(
    (acc, note) => {
      note.noteFields.forEach((noteField) => {
        ;[...new Set(noteField.mentions)]?.forEach((mention) => {
          if (!acc[mention]) {
            acc[mention] = []
          }
          acc[mention]?.push(note)
        })
      })
      return acc
    },
    {} as Record<string, Note[]>,
  )

  const mentionsWithCount = Object.keys(mentions || {})
    .map((mention) => ({
      mention,
      count: mentions?.[mention]?.length || 0,
    }))
    .sort((a, b) => b.count - a.count)

  const mentionsWithNotes = mentionsWithCount.map(({ mention, count }) => {
    const notesUsingMention = mentions?.[mention] || []

    const mentionsInNote = notesUsingMention.flatMap((note) => {
      return note?.noteFields.flatMap((noteField) => {
        const mentionParagraphAndChildIndex = [] as number[][]
        const content = noteField.content as NoteParagraph[]

        content?.forEach((paragraph, pragraphIndex) => {
          paragraph.children.forEach((child, childIndex) => {
            if (child.type === 'mention' && child.hashtag === mention) {
              mentionParagraphAndChildIndex.push([pragraphIndex, childIndex])
            }
          })
        })

        const vals = mentionParagraphAndChildIndex
          .map(([pi, ci]) => {
            if (typeof pi !== 'number' || typeof ci !== 'number') return null

            const prevParagraphs = content
              .slice(0, pi)
              .map((x) =>
                x.children.map((y) => y.text || y.children?.[0]?.text).join(''),
              )
              .join('\n')

            const prevChildren = content[pi]?.children
              .slice(0, ci)
              .map((x) => x.text || x.children?.[0]?.text)
              .join('')

            const nextChildren = content[pi]?.children
              .slice(ci + 1)
              .map((x) => x.text || x.children?.[0]?.text)
              .join('')

            const nextParagraphs = content
              .slice(pi + 1)
              .map((x) =>
                x.children.map((y) => y.text || y.children?.[0]?.text).join(''),
              )
              .join('\n')

            const sentenceSplitRegex = /(?<=[.!?])\s+/g
            const left = (prevParagraphs + ' ' + prevChildren).split(
              sentenceSplitRegex,
            )
            const right = (nextChildren + ' ' + nextParagraphs).split(
              sentenceSplitRegex,
            )

            const leftId = `left_${pi}_${ci}_${noteField.id}`
            const rightId = `right_${pi}_${ci}_${noteField.id}`

            const sentencesToIncludeLeft =
              p.sentencesToInclude?.[leftId] ?? p.minSentences ?? 1
            const sentencesToIncludeRight =
              p.sentencesToInclude?.[rightId] ?? p.minSentences ?? 1

            const canLeftLeft = sentencesToIncludeLeft < left.length
            const canLeftRight = sentencesToIncludeLeft > 1
            const canRightLeft = sentencesToIncludeRight > 1
            const canRightRight = sentencesToIncludeRight < right.length

            const leftText = left.splice(-sentencesToIncludeLeft).join(' ')
            const rightText = right.splice(0, sentencesToIncludeRight).join(' ')

            return {
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
            }
          })
          .filter(Boolean)
        return vals
      })
    })

    return {
      mention,
      count,
      mentionsInNote,
    }
  })

  return mentionsWithNotes
}
