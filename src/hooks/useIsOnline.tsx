import {
  createContext,
  FC,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from 'react'

type State = {
  isOnline: boolean
}

const defaultValue: State = {
  isOnline: true,
}

export const IsOnlineContext = createContext<State>(defaultValue)
export const useIsOnline = (): State => useContext(IsOnlineContext)

type IsOnlineProviderProps = {
  children: ReactElement
}

export const IsOnlineProvider: FC<IsOnlineProviderProps> = (p) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator?.onLine : true,
  )

  useEffect(() => {
    window.addEventListener('offline', () => {
      setIsOnline(false)
    })
    window.addEventListener('online', () => {
      setIsOnline(true)
    })

    return () => {
      window.removeEventListener('offline', () => {
        setIsOnline(false)
      })
      window.removeEventListener('online', () => {
        setIsOnline(true)
      })
    }
  }, [])

  return (
    <IsOnlineContext.Provider
      value={{
        isOnline,
      }}
    >
      {p.children}
    </IsOnlineContext.Provider>
  )
}
