import { createTRPCRouter } from '../../trpc'
import { acceptAccessRequest } from './acceptAccessRequest'
import { addSuperAdmin } from './addSuperAdmin'
import { allAccessRequests } from './allAccessRequests'
import { allFiles } from './allFiles'
import { allNotes } from './allNotes'
import { allProjects } from './allProjects'
import { allStats } from './allStats'
import { allUsers } from './allUsers'
import { deleteAccessRequest } from './deleteAccessRequest'
import { deleteFile } from './deleteFile'
import { deleteNote } from './deleteNote'
import { deleteProject } from './deleteProject'
import { deleteSuperAdmin } from './deleteSuperAdmin'
import { deleteUser } from './deleteUser'
import { getSuperAdminKey } from './getSuperAdminKey'
import { requestSuperAdminKey } from './requestSuperAdminKey'
import { searchForUserEmails } from './searchForUserEmails'
import { sendEmailToAllUsers } from './sendEmailToAllUsers'
import { superAdmin } from './superAdmin'
import { superAdmins } from './superAdmins'
import { transferProjects } from './transferProjects'

export const superAdminRouter = createTRPCRouter({
  superAdmin,
  superAdmins,
  addSuperAdmin,
  deleteSuperAdmin,
  allUsers,
  allProjects,
  allNotes,
  allFiles,
  allStats,
  deleteUser,
  deleteProject,
  deleteNote,
  deleteFile,
  allAccessRequests,
  acceptAccessRequest,
  deleteAccessRequest,
  sendEmailToAllUsers,
  searchForUserEmails,
  transferProjects,
  requestSuperAdminKey,
  getSuperAdminKey,
})
