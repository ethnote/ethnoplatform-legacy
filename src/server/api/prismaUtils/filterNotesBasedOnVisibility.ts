import {
  AccessibilityLevel,
  Note,
  NoteField,
  Project,
  ProjectMembership,
  ProjectRole,
  User,
} from '@prisma/client'
import { Session } from 'next-auth'

type ProjectWithNotes =
  | (Partial<Project> & {
      notes:
        | (Partial<Note> & {
            author: Partial<User> | null
            noteFields: (Partial<NoteField> | null)[]
          })[]
        | null
      projectMemberships:
        | (Partial<ProjectMembership> & {
            user: Partial<User> | null
          })[]
        | null
    })
  | null

export const filterNotesBasedOnVisibility = (
  session: Omit<Session, 'expires'> | null,
  project: ProjectWithNotes,
) => {
  const isProjectOwner = project?.projectMemberships?.some(
    (membership) =>
      membership?.user?.id === session?.user.id &&
      membership?.projectRole === ProjectRole.PROJECT_OWNER,
  )

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_AND_PROJECT_OWNER
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return isProjectOwner
      }),
    }
  }

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_ALL
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return note.isVisible
      }),
    }
  }

  if (
    project?.accessibilityLevel ===
    AccessibilityLevel.ONLY_NOTE_OWNER_UNTIL_RELEASED_TO_PROJECT_OWNER
  ) {
    return {
      ...project,
      notes: project.notes?.filter((note) => {
        if (note?.author?.id === session?.user.id) return true
        return isProjectOwner && note.isVisible
      }),
    }
  }

  return project
}
