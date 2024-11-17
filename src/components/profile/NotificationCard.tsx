import { FC } from 'react'
import { Box, Divider, Flex, Link, Tag, Text } from '@chakra-ui/react'
import { NotificationType } from '@prisma/client'
import { inferRouterOutputs } from '@trpc/server'
import moment from 'moment'
import { AppRouter } from 'server/api/root'

import { Avatar, ExpandableText } from 'components'

type Props = {
  notification: NonNullable<
    inferRouterOutputs<AppRouter>['me']['myNotifications']
  >['notifications'][0]
}

const NotificationCard: FC<Props> = (p) => {
  const projectHandle = p.notification?.project?.handle
  const commentFrom =
    p.notification.comment?.author?.fullName ||
    p.notification.comment?.author?.email

  const noteHandle = p.notification?.note?.handle
  const commentId = p.notification?.comment?.id
  const commentLink = `/projects/${projectHandle}/notes/${noteHandle}?comment=${commentId}`
  const replyToCommentId = p.notification?.comment?.isReplyToId
  const replyToCommentLink = `/projects/${projectHandle}/notes/${noteHandle}?comment=${replyToCommentId}`
  const noteLink = `/projects/${projectHandle}/notes/${noteHandle}`

  const invitationSentBy =
    p.notification.projectMembership?.invitationSentBy?.fullName ||
    p.notification.projectMembership?.invitationSentBy?.email
  const projectLink = `/projects/${projectHandle}`
  const isMember = p.notification.projectMembership?.invitationAcceptedAt

  const avatarName = {
    [NotificationType.NoteComment]: commentFrom,
    [NotificationType.NoteCommentReply]: commentFrom,
    [NotificationType.ProjectInvitation]: invitationSentBy,
    [NotificationType.NoteCommentMention]: commentFrom,
    [NotificationType.ProjectDeleteWarning]: 'Ethnote',
  }[p.notification.type] as string

  const boldProps = {
    display: 'inline-block',
    fontFamily: 'Outfit Bold',
    fontWeight: 'bold',
  }

  const TextCTA = () => {
    switch (p.notification.type) {
      case NotificationType.NoteComment:
        return (
          <>
            <Text {...boldProps}>{commentFrom}</Text> commented on your note{' '}
            <Link href={noteLink} {...boldProps}>
              {p.notification?.note?.title}
            </Link>
          </>
        )
      case NotificationType.NoteCommentReply:
        return (
          <>
            <Text {...boldProps}>{commentFrom}</Text> replied to your{' '}
            <Link href={replyToCommentLink} {...boldProps}>
              comment
            </Link>{' '}
            in the note{' '}
            <Link href={noteLink} {...boldProps}>
              {p.notification?.note?.title}
            </Link>
          </>
        )
      case NotificationType.ProjectInvitation:
        return (
          <>
            <Text {...boldProps}>{invitationSentBy}</Text> invited you to join{' '}
            <Link
              href={isMember ? projectLink : undefined}
              fontFamily={isMember ? 'Outfit Bold' : undefined}
              fontWeight={isMember ? 'bold' : undefined}
              display='inline-block'
            >
              {p.notification?.project?.name}
            </Link>
          </>
        )
      case NotificationType.NoteCommentMention:
        return (
          <>
            <Text {...boldProps}>{commentFrom}</Text> mentioned you in{' '}
            <Link href={replyToCommentLink} {...boldProps}>
              comment
            </Link>{' '}
            in the note{' '}
            <Link href={noteLink} {...boldProps}>
              {p.notification?.note?.title}
            </Link>
          </>
        )
      case NotificationType.ProjectDeleteWarning:
        return (
          <>
            <Text {...boldProps}>{p.notification?.project?.name}</Text> is
            scheduled for deletion in{' '}
            <Text {...boldProps}>
              {moment(p.notification.project?.setToBeDeletedAt).diff(
                moment(),
                'days',
              )}{' '}
              days
            </Text>{' '}
            if it remains inactive.
          </>
        )
      default:
        return <></>
    }
  }

  const BottomCTA = () => {
    switch (p.notification.type) {
      case NotificationType.NoteComment:
      case NotificationType.NoteCommentReply:
      case NotificationType.NoteCommentMention:
        return (
          <ExpandableText
            link={commentLink}
            text={`"${p.notification.comment?.content || ''}"`}
          />
        )
      case NotificationType.ProjectInvitation:
        return (
          <Link href='/projects'>
            <Text>Go to invitations</Text>
          </Link>
        )
      default:
        return <></>
    }
  }

  return (
    <Box>
      <Box p={2}>
        <Flex gap={4}>
          <Box>
            <Avatar name={avatarName} />
          </Box>
          <Box>
            <Text display='inline-block'>
              <TextCTA />
              {!p.notification.isRead && (
                <Tag ml={2} colorScheme='green'>
                  New
                </Tag>
              )}
            </Text>
            <Text fontSize='sm' opacity={0.5}>
              {moment(p.notification.createdAt).fromNow()}
            </Text>
            <BottomCTA />
          </Box>
        </Flex>
        <Divider mt={3} />
      </Box>
    </Box>
  )
}

export default NotificationCard
