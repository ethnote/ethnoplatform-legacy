import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type GroupMethod =
  | 'none'
  | 'week'
  | 'month'
  | 'year'
  | 'author'
  | 'template'

type NoteGroupingState = {
  notesGroupedBy: Record<string, GroupMethod>
  groupBy: (projectHandle: string) => GroupMethod
  setGroupBy: (projectHandle: string, method: GroupMethod) => void
}

export const useNoteGroupingStore = create<NoteGroupingState>()(
  persist(
    (set, get) => ({
      notesGroupedBy: {},
      groupBy: (projectHandle) => {
        return get().notesGroupedBy[projectHandle] ?? 'none'
      },
      setGroupBy: (projectHandle, method) => {
        set((state) => {
          return {
            notesGroupedBy: {
              ...state.notesGroupedBy,
              [projectHandle]: method,
            },
          }
        })
      },
    }),
    {
      name: 'group-by',
    },
  ),
)
