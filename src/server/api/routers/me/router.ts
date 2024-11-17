import { createTRPCRouter } from '../../trpc'
import { acceptTransferAllProjects } from './acceptTransferAllProjects'
import { cancelTransferAllProjects } from './cancelTransferAllProjects'
import { declineTransferAllProjects } from './declineTransferAllProjects'
import { deleteUser } from './deleteUser'
import { didSeeWalkthrough } from './didSeeWalkthrough'
import { me } from './me'
import { myNotifications } from './myNotifications'
import { notificationsSeen } from './notificationsSeen'
import { requestOtp } from './requestOtp'
import { requestTransferAllProjects } from './requestTransferAllProjects'
import { supportMessage } from './supportMessage'
import { updateUser } from './updateUser'
import { validateOtp } from './validateOtp'

export const meRouter = createTRPCRouter({
  me,
  updateUser,
  requestOtp,
  validateOtp,
  myNotifications,
  notificationsSeen,
  requestTransferAllProjects,
  acceptTransferAllProjects,
  declineTransferAllProjects,
  cancelTransferAllProjects,
  deleteUser,
  didSeeWalkthrough,
  supportMessage,
})
