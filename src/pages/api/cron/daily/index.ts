import { NextApiRequest, NextApiResponse } from 'next'
import { ProjectRole } from '@prisma/client'
import { env } from 'env.mjs'
import moment from 'moment'
import { projectDeleteWarningNotification } from 'server/api/notifications/projectDeleteWarningNotification'
import { prisma } from 'server/db'
import { sendEmail } from 'server/email'
import { projectsToBeDeletedTemplate } from 'server/emailTemplate/projectsToBeDeletedAdmin'

export default async function dailyCron(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { accessSecret } = req.query

  if (accessSecret !== env.CRON_ACCESS_SECRET) {
    return res.status(401).send('Unauthorized')
  }

  // Find projects where notes have not been updated in the last year
  const inactiveProjects = await prisma.project.findMany({
    where: {
      createdAt: {
        lte: moment().subtract(1, 'year').toDate(),
      },
      notes: {
        every: {
          updatedAt: {
            lte: moment().subtract(1, 'year').toDate(),
          },
        },
      },
    },
    include: {
      projectMemberships: {
        include: {
          user: true,
        },
      },
    },
  })

  const projectsWithoutToBeDeletedAt = inactiveProjects.filter(
    (p) => p.setToBeDeletedAt === null,
  )

  const buffer = 30
  const initalWarning = 90 + buffer

  for (const project of projectsWithoutToBeDeletedAt) {
    // Set toBeDeletedAt to 90 + 30 days from now
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        setToBeDeletedAt: moment().add(initalWarning, 'days').toDate(),
      },
    })

    // Send email to project owner
    for (const projectMembership of project.projectMemberships.filter(
      (pm) => pm.projectRole === ProjectRole.PROJECT_OWNER,
    )) {
      if (!projectMembership.user?.email) continue

      await projectDeleteWarningNotification({
        email: projectMembership.user.email,
        projectId: project.id,
        projectMembershipId: projectMembership.id,
        remainingDays: initalWarning - buffer,
      })
    }
  }

  const projectsWithToBeDeletedAt = inactiveProjects.filter(
    (p) => p.setToBeDeletedAt !== null,
  )

  const warnings = [30 + buffer, 1 + buffer]

  let projectToBeDeleted = 0

  for (const project of projectsWithToBeDeletedAt) {
    const toBeDeletedAt = moment(project.setToBeDeletedAt)

    for (const warning of warnings) {
      if (moment().isSame(toBeDeletedAt.subtract(warning, 'days'), 'day')) {
        // Send email to project owner
        for (const projectMembership of project.projectMemberships.filter(
          (pm) => pm.projectRole === ProjectRole.PROJECT_OWNER,
        )) {
          if (!projectMembership.user?.email) continue

          await projectDeleteWarningNotification({
            email: projectMembership.user.email,
            projectId: project.id,
            projectMembershipId: projectMembership.id,
            remainingDays: warning - buffer,
          })
        }
      }
    }

    if (moment().isSame(toBeDeletedAt, 'day')) {
      projectToBeDeleted++

      // Delete project
      // await prisma.project.delete({
      //   where: {
      //     id: project.id,
      //   },
      // })
    }
  }

  if (projectToBeDeleted > 0) {
    // Send email to super admin
    await sendEmail({
      template: projectsToBeDeletedTemplate,
      to: 'app@ethnote.org',
      message: {
        projectToBeDeleted,
      },
      subject: `${projectToBeDeleted} project${
        projectToBeDeleted > 1 ? 's' : ''
      } have been inactive for a 12 months`,
    })
  }

  return res.status(200).send('OK')
}
