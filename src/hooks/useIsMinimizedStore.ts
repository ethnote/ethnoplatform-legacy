import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface IsMinimizedState {
  minimizedIds: string[]
  addMinimizedId: (id: string) => void
  removeMinimizedId: (id: string) => void
}

export const useIsMinimizedStore = create<IsMinimizedState>()(
  devtools(
    persist(
      (set) => ({
        minimizedIds: [],
        addMinimizedId: (id) =>
          set((s) => ({ minimizedIds: [...s.minimizedIds, id] })),
        removeMinimizedId: (id) =>
          set((s) => ({
            minimizedIds: s.minimizedIds.filter((i) => i !== id),
          })),
      }),
      {
        name: 'is-minimized',
      },
    ),
  ),
)
