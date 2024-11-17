import { FC, useEffect, useState } from 'react'
import { IconButton, Tooltip } from '@chakra-ui/react'
import { useGeolocated } from 'react-geolocated'
import {
  MdOutlineLocationOff,
  MdOutlineLocationOn,
  MdOutlineNotListedLocation,
} from 'react-icons/md'

import { useConfirm } from 'hooks/useConfirm'

export type Coordinates = {
  latitude: number
  longitude: number
}

type Props = {
  setCoordinates: (coordinates: Coordinates) => void
  canEdit: boolean
}

const GeolocationButton: FC<Props> = (p) => {
  const [location, setLocation] = useState<Coordinates>()
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [didAskForLocation, setDidAskForLocation] = useState<boolean>(false)
  const { confirm } = useConfirm()

  if (!p.canEdit) return null

  return (
    <>
      {didAskForLocation && (
        <Geolocation
          setLocation={setLocation}
          setIsAvailable={setIsAvailable}
        />
      )}
      {didAskForLocation && (
        <Tooltip
          label={isAvailable ? 'Get location' : 'Location not available'}
        >
          <IconButton
            isDisabled={!isAvailable}
            onClick={() => location && p.setCoordinates(location)}
            icon={
              isAvailable ? <MdOutlineLocationOn /> : <MdOutlineLocationOff />
            }
            aria-label={'Set location'}
          />
        </Tooltip>
      )}
      {!didAskForLocation && (
        <Tooltip label='Ask for location'>
          <IconButton
            onClick={() => {
              confirm({
                title: 'Get Location',
                message: 'A pop-up will ask for your location.',
                onConfirm: () => {
                  setDidAskForLocation(true)
                },
              })
            }}
            icon={<MdOutlineNotListedLocation />}
            aria-label={'Ask for location'}
          />
        </Tooltip>
      )}
    </>
  )
}

export default GeolocationButton

type GeolocationProps = {
  setLocation: (coordinates: Coordinates) => void
  setIsAvailable: (isAvailable: boolean) => void
}

const Geolocation: FC<GeolocationProps> = (p) => {
  const { coords, isGeolocationAvailable, isGeolocationEnabled } =
    useGeolocated({
      positionOptions: {
        enableHighAccuracy: false,
      },
      userDecisionTimeout: 5000,
    })

  useEffect(() => {
    if (coords) {
      p.setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    }
  }, [coords])

  useEffect(() => {
    p.setIsAvailable(isGeolocationAvailable && isGeolocationEnabled)
  }, [isGeolocationAvailable, isGeolocationEnabled])

  return <></>
}
