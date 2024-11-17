import { EasyForm } from 'components'
import { EasyFormYup, FieldSettingsFalsable } from 'components/common/EasyForm'
import { useCrud } from './useCrud'

export type CreateUpdateReturnType<T> = {
  open: (initialValues?: Partial<T>) => void
}

type UseCreateUpdateProps<T> = {
  formConfig: Partial<
    Record<Extract<keyof T, string>, FieldSettingsFalsable<T>>
  >
  yupSchema?: EasyFormYup<T>
  entityName: string
  type: 'create' | 'update'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: (values: T) => Promise<any>
  onSuccess?: () => Promise<void>
  initialValues?: Partial<T>
}

export function useCreateUpdate<T>(
  p: UseCreateUpdateProps<T>,
): CreateUpdateReturnType<T> {
  const { setTitle, setFormElement, setModalIsOpen, triggerNotification } =
    useCrud()

  const _onSuccess = () => {
    closeModal()
    triggerNotification(
      'Success',
      `${'Successfully'} ${typeMode(
        'created',
        'updated',
      )} ${p.entityName.toLocaleLowerCase()}`,
      'success',
    )
  }

  const typeMode = (create: string, update: string) => {
    return p.type === 'create' ? create : update
  }

  const onError = (errorMessage?: string) => {
    triggerNotification(
      'Error',
      errorMessage ??
        `${'An error occured while'} ${typeMode(
          'creating',
          'updating',
        )} ${p.entityName.toLocaleLowerCase()}`,
      'error',
    )
  }

  const closeModal = () => {
    setModalIsOpen(false)
  }

  const open = (initialValues?: Partial<T>) => {
    setTitle(`${typeMode('Create', 'Update')} ${p.entityName}`)
    setFormElement(
      <EasyForm<T>
        loading={false} // Handled by easy form itself
        config={p.formConfig}
        initialValues={initialValues}
        submitButtonText={`${typeMode('Create', 'Update')}`}
        onCancel={closeModal}
        onSubmit={(val, cb) => {
          p.mutation(val as T)
            .catch((e: any) => {
              onError(JSON.stringify(e))
            })
            .then(async () => {
              _onSuccess()
              await p.onSuccess?.()
            })
            .finally(() => {
              cb()
            })
        }}
        yupSchema={p.yupSchema}
      />,
    )
    setModalIsOpen(true)
  }

  return {
    open,
  }
}
