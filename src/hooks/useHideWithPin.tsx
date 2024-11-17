import {
  createContext,
  FC,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Box,
  Button,
  Center,
  HStack,
  PinInput,
  PinInputField,
  Switch,
  Text,
} from '@chakra-ui/react'
import moment from 'moment'
import { signOut } from 'next-auth/react'
import { AiFillLock, AiFillUnlock } from 'react-icons/ai'
import secureLocalStorage from 'react-secure-storage'
import { useIdle } from 'react-use'
import { create } from 'zustand'
import { devtools, persist, StorageValue } from 'zustand/middleware'

import { Modal } from 'components'

type State = {
  openPinModal: () => void
}

const defaultValue: State = {
  openPinModal: () => {},
}

export const HideWithPinContext = createContext<State>(defaultValue)
export const useHideWithPin = (): State => useContext(HideWithPinContext)

type HideWithPinProviderProps = {
  children: ReactElement
}

interface PinState {
  isLocked: boolean
  setIsLocked: (isLocked: boolean) => void
  pin: string
  _setPin: (pin: string) => void
  lockWhenIdle: boolean
  setLockWhenIdle: (lockWhenIdle: boolean) => void
  lastTimeActive: Date
  setLastTimeActive: (lastTimeActive: Date) => void
}

export const usePinStore = create<PinState>()(
  devtools(
    persist(
      (set) => ({
        isLocked: false,
        setIsLocked: (isLocked) => set({ isLocked }),
        pin: '',
        _setPin: (pin) => set({ pin }),
        lockWhenIdle: false,
        setLockWhenIdle: (lockWhenIdle) => set({ lockWhenIdle }),
        lastTimeActive: new Date(),
        setLastTimeActive: (lastTimeActive) => set({ lastTimeActive }),
      }),
      {
        name: 'storage',
        storage: {
          getItem: (key) =>
            secureLocalStorage.getItem(key) as
              | StorageValue<PinState>
              | Promise<StorageValue<PinState> | null>
              | null,
          setItem: (key, value) =>
            secureLocalStorage.setItem(key, JSON.stringify(value)),
          removeItem: (key) => secureLocalStorage.removeItem(key),
        },
      },
    ),
  ),
)

// This features is NOT secure. It's only meant to hide to interface.
// The PIN can be removed by clearing the localStorage.

export const HideWithPinProvider: FC<HideWithPinProviderProps> = (p) => {
  const {
    pin,
    _setPin,
    isLocked: _isLocked,
    setIsLocked,
    lockWhenIdle,
    setLockWhenIdle,
    lastTimeActive,
    setLastTimeActive,
  } = usePinStore()
  const [tempPin, setTempPin] = useState<string>('')
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isLocked, _setIsLocked] = useState<boolean>(false)
  const [shouldLockWhenIdle, setShouldLockWhenIdle] = useState<boolean>(false)
  const idle = useIdle(1000 * 60 * 15) // 15 minutes
  const [checkedAtOpen, setCheckedAtOpen] = useState<boolean>(false)

  // Check if the app should be locked when opening the app
  useEffect(() => {
    if (!checkedAtOpen) return
    if (
      !isLocked &&
      pin &&
      lockWhenIdle &&
      moment(lastTimeActive).isBefore(moment().subtract(15, 'minutes'))
    ) {
      setIsLocked(true)
      _setIsLocked(true)
      setModalIsOpen(true)
    }
    lastTimeActive && setCheckedAtOpen(true)
  }, [lastTimeActive])

  useEffect(() => {
    if (!idle) setLastTimeActive(new Date())
    if (idle && !isLocked && pin && lockWhenIdle) {
      if (moment(lastTimeActive).isBefore(moment().subtract(10, 'minutes'))) {
        setIsLocked(true)
        _setIsLocked(true)
        setModalIsOpen(true)
      }
    }
  }, [idle])

  useEffect(() => {
    _setIsLocked(_isLocked)
    if (_isLocked) setModalIsOpen(true)
  }, [_isLocked])

  const unlock = () => {
    if (tempPin === pin) {
      setIsLocked(false)
      setModalIsOpen(false)
      setTempPin('')
    } else {
      setErrorMessage('Incorrect PIN')
      setTempPin('')
    }
  }

  const setPin = () => {
    if (!tempPin) return
    setLockWhenIdle(shouldLockWhenIdle)
    setIsLocked(true)
    _setIsLocked(true)
    _setPin(tempPin)
    setTempPin('')
  }

  const openPinModal = () => {
    setModalIsOpen(true)
  }

  const title = isLocked
    ? 'This device is locked with PIN'
    : 'Lock this device with PIN'
  const description = isLocked
    ? 'Enter your PIN to unlock this device. If you forgot your PIN, you can log out of the device'
    : 'You can lock your account with a PIN. This will prevent anyone from accessing your account on this device.'

  const pinModal = useMemo(() => {
    return (
      <Modal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        title={title}
        size='md'
        closeOnOverlayClick={false}
      >
        <Center w='100%' mt={3} flexDir='column'>
          <Text fontSize='sm' mb={8} mt={4} textAlign='center'>
            {description}
          </Text>
          {errorMessage && (
            <Text color='red.500' mb={8}>
              {errorMessage}
            </Text>
          )}
          <HStack>
            <PinInput value={tempPin} onChange={setTempPin}>
              <PinInputField autoFocus />
              <PinInputField />
              <PinInputField />
              <PinInputField
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    isLocked ? unlock() : setPin()
                  }
                }}
              />
            </PinInput>
          </HStack>
          <Box mt={8} mb={4} w='100%'>
            {!isLocked && (
              <Switch
                mb={4}
                checked={shouldLockWhenIdle}
                onChange={() => {
                  setShouldLockWhenIdle((i) => !i)
                }}
              >
                Lock device when idle for 15 minutes
              </Switch>
            )}
            <Button
              isDisabled={tempPin?.length !== 4}
              rightIcon={isLocked ? <AiFillUnlock /> : <AiFillLock />}
              colorScheme='blue'
              w='100%'
              type='submit'
              onClick={isLocked ? unlock : setPin}
              mb={2}
            >
              {isLocked ? 'Unlock device' : 'Lock with PIN'}
            </Button>
            {isLocked && (
              <Button
                onClick={() => {
                  setIsLocked(false)
                  _setIsLocked(false)
                  _setPin('')
                  signOut()
                }}
                w='100%'
                mb={2}
              >
                Sign out of device
              </Button>
            )}
            {lockWhenIdle && !isLocked && (
              <Button
                onClick={() => {
                  setLockWhenIdle(false)
                }}
                w='100%'
                mb={2}
              >
                Remove idle lock
              </Button>
            )}
            {!isLocked && (
              <Button
                onClick={() => {
                  setModalIsOpen(false)
                  setTempPin('')
                }}
                w='100%'
                mb={2}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Center>
      </Modal>
    )
  }, [
    modalIsOpen,
    tempPin,
    pin,
    isLocked,
    errorMessage,
    shouldLockWhenIdle,
    lockWhenIdle,
  ])

  return (
    <HideWithPinContext.Provider
      value={{
        openPinModal,
      }}
    >
      {!isLocked && p.children}
      {pinModal}
    </HideWithPinContext.Provider>
  )
}
