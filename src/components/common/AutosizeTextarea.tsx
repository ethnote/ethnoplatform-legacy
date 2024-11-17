import { FC, useEffect, useRef } from 'react'
import { Textarea, TextareaProps } from '@chakra-ui/react'
import autosize from 'autosize'

const AutosizeTextarea: FC<TextareaProps> = (p) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current && autosize(ref.current)
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      ref.current && autosize.destroy(ref.current)
    }
  }, [])

  return <Textarea {...p} ref={ref} />
}

export default AutosizeTextarea
