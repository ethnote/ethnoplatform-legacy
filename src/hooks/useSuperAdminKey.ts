import { useMemo } from 'react'
import jsonwebtoken from 'jsonwebtoken'
import moment from 'moment'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SuperAdminKeyState = {
  jwt: string
  setJwt: (jwt: string) => void
}

const useSuperAdminKeyStore = create<SuperAdminKeyState>()(
  persist(
    (set) => ({
      jwt: '',
      setJwt: (jwt) => set({ jwt }),
    }),
    {
      name: 'super-admin-key',
    },
  ),
)

export const useSuperAdminKey = () => {
  const { jwt, setJwt } = useSuperAdminKeyStore()

  const decodedJwt = useMemo(() => jsonwebtoken.decode(jwt), [jwt])

  const isSuperAdminKeyValid = moment(
    ((decodedJwt as { exp: number } | null)?.exp || 0) * 1000,
  ).isAfter(moment())

  return {
    isSuperAdminKeyValid,
    setJwt,
    superAdminKey: jwt,
  }
}
