import { FC, useState } from 'react'
import { NextPage } from 'next'
import { Center, Container, Heading, Text, useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'

import { AuthenticatedLayout } from 'layouts'
import { api } from 'utils/api'
import { useAdminDashboardTabs } from 'hooks/useAdminDashboardTabs'
import { useSuperAdminKey } from 'hooks/useSuperAdminKey'
import { ContentBox, EasyForm, ItemIsLocked, PageDocument } from 'components'

type SendEmail = {
  subject: string
  body: string
}

const AdminSendEmail: FC<NextPage> = () => {
  const { data: session } = useSession()
  const tabs = useAdminDashboardTabs()
  const toast = useToast()
  const [didSend, setDidSend] = useState(false)
  const [mailCount, setMailCount] = useState(0)
  const { isSuperAdminKeyValid } = useSuperAdminKey()

  const sendEmailToAllUsers = api.superAdmin.sendEmailToAllUsers.useMutation({
    onSuccess({ mailCount }) {
      toast({
        title: 'Email sent',
        description: `Email sent to all ${mailCount} users`,
        status: 'success',
        duration: 6000,
        isClosable: true,
      })
      setMailCount(mailCount)
      setDidSend(true)
    },
    onError() {
      toast({
        title: 'Error',
        description: 'Error sending email to all users',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
    },
  })

  const onSubmit = ({ subject, body }: Partial<SendEmail>) => {
    if (!subject || !body) return
    sendEmailToAllUsers.mutate({
      subject,
      body,
    })
  }

  return (
    <AuthenticatedLayout session={session} pageTitle={'Send Email | Admin'}>
      <PageDocument extraWide header={'Send Email'} tabs={tabs}>
        {!isSuperAdminKeyValid ? (
          <ItemIsLocked />
        ) : (
          <>
            <ContentBox>
              {!didSend ? (
                <Container maxW='4xl'>
                  <Text mb={4} mt={2}>
                    Send email to every user on the platform
                  </Text>
                  <EasyForm<SendEmail>
                    config={{
                      subject: {
                        kind: 'input',
                        label: 'Subject',
                      },
                      body: {
                        kind: 'textarea',
                        label: 'Body',
                      },
                    }}
                    onSubmit={onSubmit}
                    loading={sendEmailToAllUsers.isLoading}
                  />
                </Container>
              ) : (
                <Heading>Email sent to {mailCount} users 🎉</Heading>
              )}
            </ContentBox>
          </>
        )}
      </PageDocument>
    </AuthenticatedLayout>
  )
}

export default AdminSendEmail
