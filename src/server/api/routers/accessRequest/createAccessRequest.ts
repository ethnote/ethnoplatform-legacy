import { env } from 'env.mjs'
import { sendEmail } from 'server/email'
import { accessRequestTemplate } from 'server/emailTemplate/accessRequest'
import { accessRequestAdminTemplate } from 'server/emailTemplate/accessRequestAdmin'
import { z } from 'zod'

import { publicProcedure } from '../../trpc'

export const createAccessRequest = publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      fullName: z.string(),
      nameOfInitialProject: z.string().optional().nullable(),
      institution: z.string().optional().nullable(),
      intendedUse: z.string().optional().nullable(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma } = ctx
    const {
      email: _email,
      fullName,
      nameOfInitialProject,
      institution,
      intendedUse,
    } = input

    const email = _email.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const existingAccessRequest = await prisma.accessRequest.findFirst({
      where: {
        email,
        isAccepted: false,
      },
    })

    if (existingAccessRequest) {
      throw new Error(
        'Access request already exists. Please wait for approval.',
      )
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        email,
        fullName,
        nameOfInitialProject,
        institution,
        intendedUse,
      },
    })

    await sendEmail({
      template: accessRequestTemplate,
      to: email,
      message: {
        fullName,
      },
      subject: 'We have received your request to access Ethnote',
    })

    await sendEmail({
      template: accessRequestAdminTemplate,
      to: 'access-request@ethnote.org',
      message: {
        email,
        fullName,
        url: env.NEXTAUTH_URL,
      },
      subject: `New access request from ${fullName} <${email}>`,
    })

    return accessRequest
  })
