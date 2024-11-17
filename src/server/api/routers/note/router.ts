import { createTRPCRouter } from '../../trpc'
import { deleteFile } from './deleteFile'
import { getFileUrl } from './getFileUrl'
import { getHashtags } from './getHashtags'
import { getHashtagsByNote } from './getHashtagsByNote'
import { getMentions } from './getMentions'
import { getMentionsByNote } from './getMentionsByNote'
import { getNoteFieldHistory } from './getNoteFieldHistory'
import { getSharedTags } from './getSharedTags'
import { note } from './note'
import { searchForCoordinates } from './searchForCoordinates'
import { searchForLocation } from './searchForLocation'
import { takeOverSession } from './takeOverSession'
import { updateFile } from './updateFile'
import { updateMetadataField } from './updateMetadataField'
import { updateNote } from './updateNote'
import { updateNoteAuthor } from './updateNoteAuthor'
import { updateNoteField } from './updateNoteField'
import { updateNoteFields } from './updateNoteFields'
import { uploadFile } from './uploadFile'
import { uploadFileCompleted } from './uploadFileCompleted'

export const noteRouter = createTRPCRouter({
  note,
  updateNote,
  updateMetadataField,
  updateNoteField,
  uploadFile,
  getFileUrl,
  deleteFile,
  updateFile,
  getNoteFieldHistory,
  getSharedTags,
  uploadFileCompleted,
  getHashtags,
  getHashtagsByNote,
  getMentions,
  getMentionsByNote,
  takeOverSession,
  updateNoteAuthor,
  updateNoteFields,
  searchForLocation,
  searchForCoordinates,
})
