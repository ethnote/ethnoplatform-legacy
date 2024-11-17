import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SortMethod =
  | 'updated_newest'
  | 'updated_oldest'
  | 'created_newest'
  | 'created_oldest'
  | 'author_az'
  | 'author_za'
  | 'title_az'
  | 'title_za'
  | 'template_az'
  | 'template_za'

type NoteSortingState = {
  notesSortedBy: Record<string, SortMethod>
  sortBy: (projectHandle: string) => SortMethod
  setSortBy: (projectHandle: string, method: SortMethod) => void
}

export const useNoteSortingStore = create<NoteSortingState>()(
  persist(
    (set, get) => ({
      notesSortedBy: {},
      sortBy: (projectHandle) => {
        return get().notesSortedBy[projectHandle] ?? 'created_newest'
      },
      setSortBy: (projectHandle, method) => {
        set((state) => {
          return {
            notesSortedBy: {
              ...state.notesSortedBy,
              [projectHandle]: method,
            },
          }
        })
      },
    }),
    {
      name: 'sort-by',
    },
  ),
)
