import { FC } from 'react'
import { CreatableSelect } from 'chakra-react-select'

import { api } from 'utils/api'

type Props = {
  temp: string
  setTemp: (value: string) => void
  canEdit: boolean
  metadataFieldId?: string
  projectId?: string
}

const SelectSharedTags: FC<Props> = (p) => {
  const sharedTags = api.note.getSharedTags.useQuery(
    {
      projectId: p.projectId,
      metadataFieldId: p.metadataFieldId,
    },
    {
      enabled: !!p.metadataFieldId,
      refetchInterval: 1000 * 10,
    },
  )

  const options = sharedTags.data
    ?.filter((x) => !!x)
    .map((t) => ({
      label: t as string,
      value: t as string,
    }))

  return (
    <CreatableSelect
      isReadOnly={!p.canEdit}
      isDisabled={!p.canEdit}
      size='md'
      placeholder='Select or create tags...'
      isMulti
      useBasicStyles
      colorScheme={options?.length ? 'green' : 'blue'}
      options={options ?? []}
      value={
        p.temp
          .split(';')
          .map((t) => t && { label: t, value: t })
          .filter((x) => !!x) as {
          label: string
          value: string
        }[]
      }
      onChange={(e) => {
        e &&
          p.setTemp(
            e
              .map((t) => (t.value || '').replace(/;/g, ''))
              .filter((x) => !!x)
              .join(';'),
          )
      }}
    />
  )
}

export default SelectSharedTags
