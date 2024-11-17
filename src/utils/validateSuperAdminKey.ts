import { env } from 'env.mjs'
import jsonwebtoken from 'jsonwebtoken'

export const validateSuperAdminKey = (
  userId: string,
  superAdminKey: string,
) => {
  jsonwebtoken.verify(
    superAdminKey,
    env.SUPER_ADMIN_KEY_SECRET,
    (err, decoded) => {
      if (err) {
        throw new Error('Invalid super admin key')
      }

      const { superAdmninUserId } = decoded as any

      if (superAdmninUserId !== userId) {
        throw new Error('Invalid super admin key')
      }
    },
  )
}
