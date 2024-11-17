type LocationType =
  | 'street_number'
  | 'route'
  | 'locality'
  | 'political'
  | 'administrative_area_level_2'
  | 'administrative_area_level_1'
  | 'country'
  | 'postal_code'

interface AddressComponent {
  long_name: string
  short_name: string
  types: LocationType[]
}

interface Location {
  lat: number
  lng: number
}

interface Viewport {
  northeast: Location
  southwest: Location
}

interface Geometry {
  location: Location
  location_type: string
  viewport: Viewport
}

interface PlusCode {
  compound_code: string
  global_code: string
}

export interface GeocodingResult {
  address_components: AddressComponent[]
  formatted_address: string
  geometry: Geometry
  place_id: string
  plus_code: PlusCode
  types: string[]
}

export interface GeocodingResults {
  results: GeocodingResult[]
  status: string
}
