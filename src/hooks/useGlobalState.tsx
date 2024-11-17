import {
  createContext,
  FC,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useBreakpointValue } from '@chakra-ui/react'
import { nanoid } from 'nanoid'

type State = {
  lockId: string
  templateLockId: string
  isSmallScreen: boolean
  didAskToDownload: boolean | null
  setDidAskToDownload: (didAsk: boolean) => void
  isStandalone: boolean | null
  setIsStandalone: (isStandalone: boolean) => void
}

const defaultValue: State = {
  lockId: '',
  templateLockId: '',
  isSmallScreen: false,
  didAskToDownload: null,
  setDidAskToDownload: () => null,
  isStandalone: null,
  setIsStandalone: () => null,
}

export const GlobalStateContext = createContext<State>(defaultValue)
export const useGlobalState = (): State => useContext(GlobalStateContext)

type GlobalStateProviderProps = {
  children: ReactElement
}

export const GlobalStateProvider: FC<GlobalStateProviderProps> = (p) => {
  const lockId = useMemo(() => nanoid(), [])
  const templateLockId = useMemo(() => nanoid(), [])
  const isSmallScreen = !!useBreakpointValue(
    { base: true, md: false },
    { ssr: true },
  )
  const [didAskToDownload, setDidAskToDownload] = useState<boolean | null>(
    false,
  )
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null)

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  useEffect(() => {
    if (window.localStorage.getItem('didAsk')) {
      setDidAskToDownload(true)
    } else {
      setDidAskToDownload(false)
    }
  }, [])

  return (
    <GlobalStateContext.Provider
      value={{
        lockId,
        templateLockId,
        isSmallScreen,
        didAskToDownload,
        setDidAskToDownload,
        isStandalone,
        setIsStandalone,
      }}
    >
      {p.children}
    </GlobalStateContext.Provider>
  )
}
