import { FC, createContext, useContext, useState } from 'react'

type State = {
  localHashtags: Record<string, Record<string, string[]>>
  updateLocalHashtags: (
    projectHandle: string,
    notefieldId: string,
    hashtags: string[],
  ) => void
}

const defaultValue: State = {
  localHashtags: {},
  updateLocalHashtags: () => {},
}

export const SharedHashtagsContext = createContext<State>(defaultValue)
export const useSharedHashtags = (): State => useContext(SharedHashtagsContext)

type SharedHashtagsProviderProps = {
  children: JSX.Element | JSX.Element[]
}

export const SharedHashtagsProvider: FC<SharedHashtagsProviderProps> = (p) => {
  const [localHashtags, setLocalHashtags] = useState<
    Record<string, Record<string, string[]>>
  >({})

  const updateLocalHashtags = (
    projectHandle: string,
    notefieldId: string,
    hashtags: string[],
  ) => {
    setLocalHashtags((prev) => ({
      ...prev,
      [projectHandle]: {
        ...prev[projectHandle],
        [notefieldId]: hashtags,
      },
    }))
  }

  return (
    <SharedHashtagsContext.Provider
      value={{
        localHashtags,
        updateLocalHashtags,
      }}
    >
      {p.children}
    </SharedHashtagsContext.Provider>
  )
}
