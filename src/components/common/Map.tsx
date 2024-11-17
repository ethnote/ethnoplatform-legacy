import { FC, useCallback, useEffect, useState } from 'react'
import { Skeleton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { env } from 'env.mjs'
import { MAP_STYLE_DARK } from 'styles/mapStyleDark'
import { MAP_STYLE_LIGHT } from 'styles/mapStyleLight'

type Pin = {
  latitude: number
  longitude: number
  name?: string
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

type Props = {
  pins: Pin[]
}

const Map: FC<Props> = (p) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  })
  const { colorMode } = useColorMode()
  const mapStyle = useColorModeValue(MAP_STYLE_LIGHT, MAP_STYLE_DARK)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (p.pins.length > 1) {
        const bounds = new window.google.maps.LatLngBounds()

        p.pins?.map((marker) => {
          bounds.extend({
            lat: marker.latitude,
            lng: marker.longitude,
          })
        })
        map.fitBounds(bounds)
        setMap(map)
      } else if (p.pins.length === 1) {
        map.setCenter({
          lat: p.pins[0]?.latitude || 0,
          lng: p.pins[0]?.longitude || 0,
        })
        map.setZoom(12)
        setMap(map)
      }
    },
    [p.pins],
  )

  useEffect(() => {
    if (map && p.pins.length === 1) {
      map.setCenter({
        lat: p.pins[0]?.latitude || 0,
        lng: p.pins[0]?.longitude || 0,
      })
      map.setZoom(12)
    }
  }, [map, p.pins])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (!isLoaded) {
    return <Skeleton height='120px' />
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: mapStyle,
        disableDefaultUI: true,
        zoomControl: false,
      }}
    >
      {p.pins?.map((pin) => {
        return (
          <Marker
            key={Math.random()} // Seems like a hack
            position={{
              lat: pin.latitude,
              lng: pin.longitude,
            }}
            label={
              pin.name
                ? {
                    text: pin.name ?? '',
                    color: colorMode === 'dark' ? '#fff' : '#000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    className: 'marker-label',
                  }
                : undefined
            }
          />
        )
      })}
    </GoogleMap>
  )
}

export default Map
