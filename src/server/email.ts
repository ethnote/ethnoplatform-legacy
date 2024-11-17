import AWS from 'aws-sdk'
import { env } from 'env.mjs'
import { compile } from 'handlebars'
import { createTransport } from 'nodemailer'

type Props = {
  template: string
  message?: Record<string, any>
  to: string
  subject: string
}

export const sendEmail = (p: Props) =>
  new Promise((resolve, reject) => {
    const smtpTransport = createTransport({
      SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: 'eu-north-1',
        credentials: {
          accessKeyId: env.SERVER_AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: env.SERVER_AWS_SES_ACCESS_KEY_SECRET,
        },
      }),
    })

    const template = compile(p.template)
    const htmlToSend = template(p.message)
    const mailOptions = {
      from: 'Ethnote <app@ethnote.org>',
      to: p.to,
      subject: p.subject,
      html: htmlToSend,
    }

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error)
        reject('Error sending email.')
      } else {
        console.log('Successfully sent email.')
        resolve(response)
      }
    })
  })
