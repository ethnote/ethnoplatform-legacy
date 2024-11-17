import { NotificationType } from '@prisma/client'
import { env } from 'env.mjs'
import { prisma } from 'server/db'
import { sendEmail } from 'server/email'
import { invitationTemplate } from 'server/emailTemplate/invitation'
import { publishMessage } from 'server/realtime/publishMessage'

export const projectInvitationNotification = async ({
  email,
  projectId,
  projectMembershipId,
}: {
  email: string
  projectId: string
  projectMembershipId: string
}) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  })

  if (user) {
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.ProjectInvitation,
        projectId,
        projectMembershipId,
      },
    })

    await publishMessage(`notification-${user.id}`, {
      showNotification: true,
      notificationId: notification.id,
      message: 'You have been invited to join a project',
    })
  }

  // Send email
  await sendEmail({
    template: invitationTemplate,
    message: {
      link: `${env.NEXTAUTH_URL}`,
    },
    to: email,
    subject: 'Invitation to join an Ethnote project',
  })
}
