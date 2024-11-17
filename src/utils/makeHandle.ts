import { nanoid } from 'nanoid'

export const makeHandle = async (
  name: string,
  isInUse?: (handle: string) => Promise<boolean>,
) => {
  const handleRoot = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  let handle = handleRoot

  if (handle.length === 0) handle = nanoid(4)

  // Check if handle is available
  if (!isInUse) return handle

  const MAX_ATTEMPTS = 10
  let attempts = 0
  while (await isInUse(handle)) {
    console.log(`${handle} is in use, trying again...`)
    handle = handleRoot + '_' + nanoid(4)
    attempts++
    if (attempts > MAX_ATTEMPTS) {
      throw new Error('Could not generate handle')
    }
  }

  return handle
}
