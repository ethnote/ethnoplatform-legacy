import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Input, Text, useColorModeValue } from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { CreatableSelect, SelectInstance } from 'chakra-react-select'
import { BORDER_RADIUS } from 'constants/constants'
import { debounce } from 'lodash'
import { GeocodingResult } from 'types/GeocodingResults'

import { api } from 'utils/api'
import {
  AutosizeTextarea,
  GeolocationButton,
  Map,
  MapLocationSelectorModal,
  SelectSharedTags,
} from 'components'
import { Coordinates } from './GeolocationButton'

export const Field = ({
  id,
  value,
  variant,
  onMetadataFieldChanged,
  canEdit,
  projectId,
}: {
  id: string
  value: string | null
  variant: MetadataFieldVariant
  onMetadataFieldChanged: ({
    metadataFieldId,
    value,
  }: {
    metadataFieldId: string
    value: string
  }) => void
  canEdit: boolean
  projectId?: string
}) => {
  const [temp, setTemp] = useState<string>(value || '')
  const [locationSearchWord, setLocationSearchWord] = useState<string>(
    value || '',
  )
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [prev, setPrev] = useState<string>(value || '')
  const [mapSelectionModalIsOpen, setMapSelectionModalIsOpen] = useState(false)
  const readOnlyBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.50')
  const locationRef = useRef<SelectInstance<any> | null>(null)
  const [rawCoordinates, setRawCoordinates] = useState<Coordinates>()
  const rawCoordinatesString = (
    (rawCoordinates?.latitude + '' ?? '0') +
    ', ' +
    (rawCoordinates?.longitude + '' ?? '0')
  ).replace(/;/g, '')

  const searchForLocation = api.note.searchForLocation.useMutation({
    onSuccess: (data) => {
      setSearchResults(data)
    },
  })

  const searchForCoordinates = api.note.searchForCoordinates.useMutation()

  useEffect(() => {
    updateDb(temp)
  }, [temp])

  const updateDb = useCallback(
    debounce((val) => {
      if (val === prev) return
      onMetadataFieldChanged({ metadataFieldId: id, value: val })
      setPrev(val)
    }, 500),
    [],
  )

  useEffect(() => {
    searchLocation(locationSearchWord)
  }, [locationSearchWord])

  const searchLocation = useCallback(
    debounce((val) => {
      searchForLocation.mutateAsync({
        searchWord: val,
      })
    }, 500),
    [],
  )

  const readOnlyProps = canEdit
    ? {}
    : {
        borderWidth: 0,
        readOnly: true,
        bg: readOnlyBg,
      }

  const stringToCoordinates = (str: string) => {
    const partsSemicolon = str.split(';')
    const partsComma = str.split(',')

    if (partsSemicolon.length === 3) {
      return {
        latitude: +(partsSemicolon[1] || 0),
        longitude: +(partsSemicolon[2] || 0),
      }
    } else if (partsComma.length === 2) {
      return {
        latitude: +(partsComma[0] || 0),
        longitude: +(partsComma[1] || 0),
      }
    } else {
      return {
        latitude: 0,
        longitude: 0,
      }
    }
  }

  const map = useMemo(() => <Map pins={[stringToCoordinates(temp)]} />, [temp])

  switch (variant) {
    case MetadataFieldVariant.SINGLE_LINE:
      return (
        <Input
          {...readOnlyProps}
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          tabIndex={-1}
        />
      )
    case MetadataFieldVariant.MULTILINE:
      return (
        <AutosizeTextarea
          {...readOnlyProps}
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          tabIndex={-1}
        />
      )
    case MetadataFieldVariant.LOCATION:
      return (
        <>
          {temp && (
            <Flex
              h={'120px'}
              mb={2}
              borderRadius={BORDER_RADIUS}
              overflow='hidden'
              onClick={() => setMapSelectionModalIsOpen(true)}
              cursor='pointer'
            >
              <Flex pointerEvents='none' w='100%' h='100%'>
                {map}
              </Flex>
            </Flex>
          )}
          <Text mb={1}>{temp.split(';')[0]}</Text>
          <Flex gap={2} w='100%'>
            <CreatableSelect
              ref={locationRef}
              isClearable
              isDisabled={!canEdit}
              isLoading={searchForLocation.isLoading}
              value=''
              // value={{
              //   label: temp.split(';')[0],
              //   value: temp,
              // }}
              onInputChange={(e) => {
                setLocationSearchWord(e)
              }}
              onCreateOption={(e) => {
                if (e) {
                  setTemp(e)
                }
              }}
              onChange={(e) => {
                if (e) {
                  setTemp(e.value)
                }
              }}
              selectedOptionStyle='check'
              filterOption={() => true}
              options={[
                !locationSearchWord &&
                  rawCoordinates &&
                  rawCoordinatesString && {
                    label: rawCoordinatesString, // The first result is the raw coordinates
                    value: [
                      rawCoordinatesString,
                      rawCoordinates?.latitude,
                      rawCoordinates?.longitude,
                    ].join(';'),
                  },
                ...searchResults.map((r) => ({
                  label: r.formatted_address,
                  value: [
                    r.formatted_address.replace(/;/g, ''),
                    r.geometry.location.lat,
                    r.geometry.location.lng,
                  ].join(';'),
                })),
              ].filter(Boolean)}
              placeholder='Search for location'
              openMenuOnFocus
              chakraStyles={{
                control: (provided) => ({
                  ...provided,
                  borderRadius: BORDER_RADIUS,
                }),
                menuList: (provided) => ({
                  ...provided,
                  borderRadius: BORDER_RADIUS,
                }),
                container: (provided) => ({
                  ...provided,
                  w: '100%',
                }),
              }}
            />
            <GeolocationButton
              setCoordinates={(coordinates) => {
                setRawCoordinates(coordinates)
                searchForCoordinates.mutateAsync(
                  {
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  },
                  {
                    onSuccess: (data) => {
                      setSearchResults(data)
                      locationRef.current?.focus()
                    },
                  },
                )
              }}
              canEdit={canEdit}
            />
            <MapLocationSelectorModal
              isOpen={mapSelectionModalIsOpen}
              onClose={() => setMapSelectionModalIsOpen(false)}
              pin={stringToCoordinates(temp)}
              onChangeCoordinates={async (coordinates: Coordinates) => {
                const data = await searchForCoordinates.mutateAsync({
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                })
                setTemp(
                  [
                    data[0]?.formatted_address.replace(/;/g, ''),
                    coordinates.latitude,
                    coordinates.longitude,
                  ].join(';'),
                )
              }}
            />
          </Flex>
        </>
      )
    case MetadataFieldVariant.DATE:
      return (
        <Input
          {...readOnlyProps}
          placeholder='Select Date and Time'
          size='md'
          type='date'
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          tabIndex={-1}
        />
      )
    case MetadataFieldVariant.TIME:
      return (
        <Input
          {...readOnlyProps}
          placeholder='Select Date and Time'
          size='md'
          type='time'
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          tabIndex={-1}
        />
      )
    case MetadataFieldVariant.DATETIME:
      return (
        <Input
          {...readOnlyProps}
          placeholder='Select Date and Time'
          size='md'
          type='datetime-local'
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          tabIndex={-1}
        />
      )
    case MetadataFieldVariant.SHARED_TAGS:
      return (
        <SelectSharedTags
          temp={temp}
          setTemp={setTemp}
          canEdit={canEdit}
          metadataFieldId={id}
          projectId={projectId}
        />
      )
    case MetadataFieldVariant.TAGS:
      return (
        <SelectSharedTags temp={temp} setTemp={setTemp} canEdit={canEdit} />
      )
    default:
      return null
  }
}
