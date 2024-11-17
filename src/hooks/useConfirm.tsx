import { FC, ReactElement, createContext, useContext, useState } from 'react'

import { Confirm } from 'components'

type ConfirmModalProps = {
  title: string
  message: string
  onConfirm?: () => void
  confirmText?: string
  isDanger?: boolean
  textToEnableConfirm?: string
}

type State = {
  confirm: (p: ConfirmModalProps) => void
}

const defaultValue: State = {
  confirm: () => {},
}

export const ConfirmContext = createContext<State>(defaultValue)
export const useConfirm = (): State => useContext(ConfirmContext)

type ConfirmProviderProps = {
  children: ReactElement
}

export const ConfirmProvider: FC<ConfirmProviderProps> = (p) => {
  const [confirmInfo, setConfirmInfo] = useState<ConfirmModalProps | null>(null)

  const confirm = (confirmProps: ConfirmModalProps) => {
    setConfirmInfo(confirmProps)
  }

  return (
    <ConfirmContext.Provider
      value={{
        confirm,
      }}
    >
      {p.children}
      <Confirm
        title={confirmInfo?.title ?? ''}
        message={confirmInfo?.message ?? ''}
        isOpen={!!confirmInfo}
        onCancel={() => setConfirmInfo(null)}
        onConfirm={() => {
          confirmInfo?.onConfirm?.()
          setConfirmInfo(null)
        }}
        confirmText={confirmInfo?.confirmText}
        isDanger={confirmInfo?.isDanger}
        textToEnableConfirm={confirmInfo?.textToEnableConfirm}
      />
    </ConfirmContext.Provider>
  )
}
