import * as Yup from 'yup'

import { api } from 'utils/api'
import { useConfirm } from './useConfirm'
import { useCreateUpdate } from './useCreateUpdate'
import { useCrud } from './useCrud'

type AddAdmin = {
  email: string
}

export const useAdminCrud = () => {
  const addAdmin = api.superAdmin.addSuperAdmin.useMutation()
  const deleteAdmin = api.superAdmin.deleteSuperAdmin.useMutation()
  const utils = api.useContext()
  const { confirm } = useConfirm()
  const { triggerNotification } = useCrud()

  const { open: openAddAdmin } = useCreateUpdate<AddAdmin>({
    type: 'create',
    formConfig: {
      email: {
        label: 'Email',
        kind: 'input',
      },
    },
    yupSchema: {
      email: Yup.string().email().required(),
    },
    entityName: 'Super Admin',
    mutation: ({ email }) =>
      new Promise(async (resolve, reject) => {
        try {
          await addAdmin.mutateAsync({
            email,
          })
          resolve(email)
        } catch (error) {
          reject()
        }
      }),
    onSuccess: async () => {
      await utils.superAdmin.superAdmins.invalidate()
    },
  })

  const openDeleteAdmin = (id?: string) => {
    if (!id) return

    confirm({
      title: 'Delete super admin',
      message: 'Are you sure you want to delete this super admin?',
      isDanger: true,
      textToEnableConfirm: 'DELETE',
      onConfirm: async () => {
        new Promise(async (resolve, reject) => {
          try {
            await deleteAdmin.mutateAsync({
              id,
            })
            await utils.superAdmin.superAdmins.invalidate()
            resolve(true)
          } catch (error: any) {
            triggerNotification('Error', error.message, 'error')
            reject()
          }
        })
      },
    })
  }

  return {
    openAddAdmin,
    deleteAdmin,
    openDeleteAdmin,
  }
}
