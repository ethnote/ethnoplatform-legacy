import { createTRPCRouter } from '../../trpc'
import { acceptInvitation } from './acceptInvitation'
import { changeRole } from './changeRole'
import { convertToDocx } from './convertToDocx'
import { convertToXlsx } from './convertToXlsx'
import { createNote } from './createNote'
import { createProject } from './createProject'
import { declineInvitation } from './declineInvitation'
import { deleteNotes } from './deleteNotes'
import { deleteProject } from './deleteProject'
import { exportNotesAsCSV } from './exportNotesAsCSV'
import { exportNotesAsDOCX } from './exportNotesAsDOCX'
import { exportNotesAsJSON } from './exportNotesAsJSON'
import { exportNotesAsTXT } from './exportNotesAsTXT'
import { exportNotesAsXLSX } from './exportNotesAsXLSX'
import { importJson } from './importJson'
import { inviteMember } from './inviteMember'
import { leaveProject } from './leaveProject'
import { moveFieldnotes } from './moveFieldnotes'
import { movePersonalNote } from './movePersonalNote'
import { project } from './project'
import { removeMember } from './removeMember'
import { takeOverTemplateSession } from './takeOverSession'
import { updateProject } from './updateProject'
import { updateTextEditorHighlights } from './updateTextEditorHighlights'

export const projectRouter = createTRPCRouter({
  createProject,
  project,
  createNote,
  updateProject,
  inviteMember,
  removeMember,
  acceptInvitation,
  declineInvitation,
  changeRole,
  deleteProject,
  leaveProject,
  deleteNotes,
  exportNotesAsJSON,
  exportNotesAsCSV,
  exportNotesAsXLSX,
  exportNotesAsTXT,
  exportNotesAsDOCX,
  updateTextEditorHighlights,
  movePersonalNote,
  convertToDocx,
  convertToXlsx,
  importJson,
  moveFieldnotes,
  takeOverTemplateSession,
})
