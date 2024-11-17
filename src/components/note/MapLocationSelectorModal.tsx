import { FC, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Image,
  Skeleton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { BORDER_RADIUS } from 'constants/constants'
import { env } from 'env.mjs'
import { MAP_STYLE_DARK } from 'styles/mapStyleDark'
import { MAP_STYLE_LIGHT } from 'styles/mapStyleLight'

import { ButtonVariant, Modal } from 'components'

type Pin = {
  latitude: number
  longitude: number
  name?: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  pin: Pin
  onChangeCoordinates: (coordinates: {
    latitude: number
    longitude: number
  }) => void
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

const MapLocationSelectorModal: FC<Props> = (p) => {
  const [centerPin, setCenterPin] = useState<Pin | null>(null)
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  })
  const mapStyle = useColorModeValue(MAP_STYLE_LIGHT, MAP_STYLE_DARK)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      map.setCenter({
        lat: p.pin.latitude || 0,
        lng: p.pin.longitude || 0,
      })
      map.setZoom(17)
      map.setMapTypeId('satellite')
      setMap(map)
    },
    [p.pin],
  )

  useEffect(() => {
    if (map) {
      map.setCenter({
        lat: p.pin?.latitude || 0,
        lng: p.pin?.longitude || 0,
      })
      map.setZoom(17)
      map.setMapTypeId('satellite')
    }
  }, [map, p.pin])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (!isLoaded) {
    return <Skeleton height='120px' />
  }

  return (
    <Modal
      isOpen={p.isOpen}
      onClose={p.onClose}
      title='Select Location'
      size='4xl'
      closeButton
      maxH='100svh'
    >
      <Text opacity={0.5} textAlign='center' mb={4}>
        Move the map around to select a location
      </Text>
      <Box h='450px' borderRadius={BORDER_RADIUS} overflow='hidden'>
        <GoogleMap
          mapContainerStyle={containerStyle}
          zoom={10}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onDragEnd={() => {
            setCenterPin({
              latitude: map?.getCenter()?.lat() || 0,
              longitude: map?.getCenter()?.lng() || 0,
            })
          }}
          onZoomChanged={() => {
            setCenterPin({
              latitude: map?.getCenter()?.lat() || 0,
              longitude: map?.getCenter()?.lng() || 0,
            })
          }}
          options={{
            styles: mapStyle,
            disableDefaultUI: true,
            zoomControl: false,
          }}
        />
        <Box
          pointerEvents='none'
          position='absolute'
          top='50%'
          left='50%'
          transform='translate(-50%, -80%)'
        >
          <Image src='/pin.webp' w='28px' h='40px' objectFit='contain' />
        </Box>
      </Box>
      <Flex justifyContent='flex-end' mt={4} mb={2}>
        <ButtonGroup>
          <Button onClick={p.onClose}>Cancel</Button>
          <ButtonVariant
            onClick={() => {
              p.onChangeCoordinates(
                centerPin ?? {
                  latitude: p.pin.latitude,
                  longitude: p.pin.longitude,
                },
              )
              p.onClose()
            }}
            colorScheme='blue'
          >
            Select new location
          </ButtonVariant>
        </ButtonGroup>
      </Flex>
    </Modal>
  )
}

export default MapLocationSelectorModal
