import { NotificationType } from '@prisma/client'
import { env } from 'env.mjs'
import { prisma } from 'server/db'
import { sendEmail } from 'server/email'
import { deleteProjectWarningTemplate } from 'server/emailTemplate/deleteProjectWarning'
import { publishMessage } from 'server/realtime/publishMessage'

export const projectDeleteWarningNotification = async ({
  email,
  projectId,
  projectMembershipId,
  remainingDays,
}: {
  email: string
  projectId: string
  projectMembershipId: string
  remainingDays: number
}) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  })

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  })

  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }

  if (user) {
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: NotificationType.ProjectDeleteWarning,
        projectId,
        projectMembershipId,
      },
    })

    await publishMessage(`notification-${user.id}`, {
      showNotification: true,
      notificationId: notification.id,
      message: `You're team leder of a inactive project. ${project.name} will be deleted in ${remainingDays} days if it remains inactive.`,
    })
  }

  // Send email
  await sendEmail({
    template: deleteProjectWarningTemplate,
    message: {
      remainingDays,
      projectName: project.name,
      link: `${env.NEXTAUTH_URL}/projects/${project.handle}/notes`,
    },
    to: email,
    subject: `${project.name} have been inactive for 12 months. It will be deleted in ${remainingDays} days if it remains inactive.`,
  })
}
