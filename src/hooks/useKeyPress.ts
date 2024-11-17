import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'

export const useKeyPress = (targetKey: string) => {
  const [keyPressed, setKeyPressed] = useState<boolean>(false)
  const downHandler = (event: any) => {
    if (isHotkey(targetKey, event as any)) {
      setKeyPressed(true)
      event.preventDefault()
      setTimeout(() => {
        setKeyPressed(false)
      }, 100)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [])

  return keyPressed
}
