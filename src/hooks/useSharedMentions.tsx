import { FC, createContext, useContext, useState } from 'react'

type State = {
  localMentions: Record<string, Record<string, string[]>>
  updateLocalMentions: (
    projectHandle: string,
    notefieldId: string,
    mentions: string[],
  ) => void
}

const defaultValue: State = {
  localMentions: {},
  updateLocalMentions: () => {},
}

export const SharedMentionsContext = createContext<State>(defaultValue)
export const useSharedMentions = (): State => useContext(SharedMentionsContext)

type SharedMentionsProviderProps = {
  children: JSX.Element | JSX.Element[]
}

export const SharedMentionsProvider: FC<SharedMentionsProviderProps> = (p) => {
  const [localMentions, setLocalMentions] = useState<
    Record<string, Record<string, string[]>>
  >({})

  const updateLocalMentions = (
    projectHandle: string,
    notefieldId: string,
    mentions: string[],
  ) => {
    setLocalMentions((prev) => ({
      ...prev,
      [projectHandle]: {
        ...prev[projectHandle],
        [notefieldId]: mentions,
      },
    }))
  }

  return (
    <SharedMentionsContext.Provider
      value={{
        localMentions,
        updateLocalMentions,
      }}
    >
      {p.children}
    </SharedMentionsContext.Provider>
  )
}
