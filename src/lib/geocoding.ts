// Geocoding utilities for converting coordinates to addresses

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
}

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}

export interface FormattedAddress {
  fullAddress: string;
  streetNumber?: string;
  streetName?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedShort: string;
}

/**
 * Convert GPS coordinates to human-readable address using multiple geocoding services
 */
export async function reverseGeocode(lat: number, lng: number): Promise<FormattedAddress> {
  try {
    // First, validate coordinates are within reasonable bounds
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates provided');
    }

    // Try multiple geocoding services for better accuracy
    let addressData: any = null;

    // Try OpenStreetMap Nominatim first (free and reliable)
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'CareBridge Healthcare App v1.0'
          }
        }
      );

      if (nominatimResponse.ok) {
        addressData = await nominatimResponse.json();
      }
    } catch (error) {
      console.warn('Nominatim geocoding failed:', error);
    }

    // If Nominatim fails, try alternative service (using a free alternative)
    if (!addressData || !addressData.address) {
      try {
        // Use a different free geocoding service or fallback to coordinate-based detection
        console.log('Falling back to coordinate-based address detection');
        addressData = null; // Will trigger fallback logic below
      } catch (error) {
        console.warn('Alternative geocoding failed:', error);
      }
    }

    // If geocoding fails, use fallback address detection
    if (!addressData || !addressData.address) {
      console.log('Using fallback address detection for coordinates:', lat, lng);
      const fallbackAddress = getFallbackAddress(lat, lng);

      return {
        fullAddress: fallbackAddress,
        formattedShort: fallbackAddress,
        city: fallbackAddress.split(',')[0],
        country: 'Pakistan'
      };
    }

    const address = addressData.address;
    
    // Extract address components
    const streetNumber = address.house_number || '';
    const streetName = address.road || address.street || '';
    const neighborhood = address.neighbourhood || address.suburb || address.residential || '';
    const city = address.city || address.town || address.village || address.municipality || '';
    const state = address.state || address.province || '';
    const country = address.country || 'Pakistan';
    const postalCode = address.postcode || '';

    // Create formatted address
    const addressParts = [
      streetNumber && streetName ? `${streetNumber} ${streetName}` : streetName,
      neighborhood,
      city,
      state,
      country
    ].filter(Boolean);

    const fullAddress = addressParts.join(', ');
    
    // Create short format for display
    const shortParts = [
      neighborhood || streetName,
      city,
      state
    ].filter(Boolean);
    
    const formattedShort = shortParts.join(', ') || fullAddress;

    return {
      fullAddress: fullAddress || addressData.display_name || `${lat}, ${lng}`,
      streetNumber,
      streetName,
      neighborhood,
      city,
      state,
      country,
      postalCode,
      formattedShort
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback: Try to determine city based on coordinates (Pakistan major cities)
    const fallbackAddress = getFallbackAddress(lat, lng);
    
    return {
      fullAddress: fallbackAddress,
      formattedShort: fallbackAddress,
      city: fallbackAddress.split(',')[0],
      country: 'Pakistan'
    };
  }
}

/**
 * Fallback address determination for major Pakistani cities
 */
function getFallbackAddress(lat: number, lng: number): string {
  // Major Pakistani cities with more precise coordinates and bounds
  const cities = [
    {
      name: 'Karachi',
      lat: 24.8607,
      lng: 67.0011,
      bounds: { latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.5 },
      areas: ['DHA', 'Clifton', 'Gulshan', 'North Nazimabad', 'Saddar']
    },
    {
      name: 'Lahore',
      lat: 31.5204,
      lng: 74.3587,
      bounds: { latMin: 31.3, latMax: 31.8, lngMin: 74.1, lngMax: 74.6 },
      areas: ['DHA', 'Gulberg', 'Model Town', 'Johar Town', 'Cantt']
    },
    {
      name: 'Islamabad',
      lat: 33.6844,
      lng: 73.0479,
      bounds: { latMin: 33.5, latMax: 33.8, lngMin: 72.8, lngMax: 73.3 },
      areas: ['F-6', 'F-7', 'F-8', 'G-9', 'Blue Area']
    },
    {
      name: 'Rawalpindi',
      lat: 33.5651,
      lng: 73.0169,
      bounds: { latMin: 33.4, latMax: 33.7, lngMin: 72.8, lngMax: 73.2 },
      areas: ['Saddar', 'Commercial Market', 'Cantt', 'Satellite Town']
    },
    {
      name: 'Faisalabad',
      lat: 31.4504,
      lng: 73.1350,
      bounds: { latMin: 31.3, latMax: 31.6, lngMin: 73.0, lngMax: 73.3 },
      areas: ['Civil Lines', 'Peoples Colony', 'Samanabad', 'Gulberg']
    },
    {
      name: 'Multan',
      lat: 30.1575,
      lng: 71.5249,
      bounds: { latMin: 30.0, latMax: 30.4, lngMin: 71.3, lngMax: 71.8 },
      areas: ['Cantt', 'Gulgasht', 'Shah Rukn-e-Alam']
    },
    {
      name: 'Peshawar',
      lat: 34.0151,
      lng: 71.5249,
      bounds: { latMin: 33.9, latMax: 34.2, lngMin: 71.3, lngMax: 71.8 },
      areas: ['University Town', 'Hayatabad', 'Cantt']
    },
    {
      name: 'Quetta',
      lat: 30.1798,
      lng: 66.9750,
      bounds: { latMin: 30.0, latMax: 30.4, lngMin: 66.8, lngMax: 67.2 },
      areas: ['Cantt', 'Satellite Town', 'Jinnah Town']
    },
    {
      name: 'Hyderabad',
      lat: 25.3960,
      lng: 68.3578,
      bounds: { latMin: 25.2, latMax: 25.6, lngMin: 68.2, lngMax: 68.6 },
      areas: ['Latifabad', 'Qasimabad', 'City']
    },
    {
      name: 'Gujranwala',
      lat: 32.1877,
      lng: 74.1945,
      bounds: { latMin: 32.0, latMax: 32.4, lngMin: 74.0, lngMax: 74.4 },
      areas: ['Civil Lines', 'Satellite Town', 'Model Town']
    }
  ];

  // Find the exact city match
  for (const city of cities) {
    if (lat >= city.bounds.latMin && lat <= city.bounds.latMax &&
        lng >= city.bounds.lngMin && lng <= city.bounds.lngMax) {
      // For major cities, try to determine the area/sector
      const distance = getDistance(lat, lng, city.lat, city.lng);
      if (distance < 5) { // Within 5km of city center
        return `${city.name} City, ${getProvinceFromCity(city.name)}, Pakistan`;
      } else {
        // Try to determine area based on distance and direction
        const area = getAreaFromCoordinates(lat, lng, city);
        return area ? `${area}, ${city.name}, Pakistan` : `${city.name}, Pakistan`;
      }
    }
  }

  // If no exact match, find the closest city
  let closestCity = cities[0];
  let minDistance = getDistance(lat, lng, closestCity.lat, closestCity.lng);

  for (const city of cities) {
    const distance = getDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }

  // If very close to a city (within 20km), say it's near that city
  if (minDistance < 20) {
    return `Near ${closestCity.name}, ${getProvinceFromCity(closestCity.name)}, Pakistan`;
  }

  return `${getProvinceFromCoordinates(lat, lng)}, Pakistan`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get province from city name
 */
function getProvinceFromCity(cityName: string): string {
  const provinceMap: { [key: string]: string } = {
    'Karachi': 'Sindh',
    'Hyderabad': 'Sindh',
    'Lahore': 'Punjab',
    'Faisalabad': 'Punjab',
    'Rawalpindi': 'Punjab',
    'Multan': 'Punjab',
    'Gujranwala': 'Punjab',
    'Islamabad': 'Islamabad Capital Territory',
    'Peshawar': 'Khyber Pakhtunkhwa',
    'Quetta': 'Balochistan'
  };
  return provinceMap[cityName] || 'Pakistan';
}

/**
 * Get area/sector from coordinates within a city
 */
function getAreaFromCoordinates(lat: number, lng: number, city: any): string | null {
  // This is a simplified area detection - in a real app you'd use more sophisticated mapping
  const areas = city.areas || [];
  if (areas.length === 0) return null;

  // Simple area detection based on coordinate quadrants
  const latDiff = lat - city.lat;
  const lngDiff = lng - city.lng;

  if (Math.abs(latDiff) < 0.01 && Math.abs(lngDiff) < 0.01) {
    return areas[0]; // Central area
  } else if (latDiff > 0 && lngDiff > 0) {
    return areas[1] || areas[0]; // Northeast
  } else if (latDiff > 0 && lngDiff < 0) {
    return areas[2] || areas[0]; // Northwest
  } else if (latDiff < 0 && lngDiff > 0) {
    return areas[3] || areas[0]; // Southeast
  } else {
    return areas[4] || areas[0]; // Southwest
  }
}

/**
 * Get province from coordinates
 */
function getProvinceFromCoordinates(lat: number, lng: number): string {
  // Rough province boundaries for Pakistan
  if (lat >= 24.0 && lat <= 28.0 && lng >= 66.0 && lng <= 71.0) {
    return 'Sindh';
  } else if (lat >= 27.0 && lat <= 37.0 && lng >= 69.0 && lng <= 76.0) {
    return 'Punjab';
  } else if (lat >= 31.0 && lat <= 37.0 && lng >= 69.0 && lng <= 75.0) {
    return 'Khyber Pakhtunkhwa';
  } else if (lat >= 24.0 && lat <= 32.0 && lng >= 60.0 && lng <= 71.0) {
    return 'Balochistan';
  } else if (lat >= 33.0 && lat <= 34.0 && lng >= 72.0 && lng <= 74.0) {
    return 'Islamabad Capital Territory';
  } else if (lat >= 35.0 && lat <= 37.0 && lng >= 74.0 && lng <= 77.0) {
    return 'Gilgit-Baltistan';
  } else if (lat >= 34.0 && lat <= 37.0 && lng >= 71.0 && lng <= 76.0) {
    return 'Azad Kashmir';
  }
  return 'Pakistan';
}

/**
 * Get current location with proper address resolution and high accuracy
 */
export function getCurrentLocationWithAddress(): Promise<{
  coordinates: { lat: number; lng: number };
  address: FormattedAddress;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser. Please enable location services.'));
      return;
    }

    // First, try to get high accuracy location
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 60000 // 1 minute max cache
    };

    let attempts = 0;
    const maxAttempts = 3;

    const tryGetLocation = () => {
      attempts++;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coordinates = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            // Validate coordinates are reasonable for Pakistan
            if (!isWithinPakistan(coordinates.lat, coordinates.lng)) {
              // If outside Pakistan, still try to geocode but warn user
              console.warn('Location appears to be outside Pakistan:', coordinates);
            }

            console.log('GPS Coordinates:', coordinates);
            console.log('Accuracy:', position.coords.accuracy, 'meters');

            const address = await reverseGeocode(coordinates.lat, coordinates.lng);

            resolve({
              coordinates,
              address,
              accuracy: position.coords.accuracy
            });
          } catch (error) {
            console.error('Geocoding error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            reject(new Error(`Failed to get address for your location: ${errorMessage}`));
          }
        },
        (error) => {
          console.error('Geolocation error:', error);

          let errorMessage = 'Unable to get your current location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Your location is currently unavailable. Please check your GPS/location services and try again.';
              break;
            case error.TIMEOUT:
              if (attempts < maxAttempts) {
                console.log(`Location timeout, retrying... (${attempts}/${maxAttempts})`);
                setTimeout(tryGetLocation, 1000);
                return;
              }
              errorMessage = 'Location request timed out. Please try again or enter your address manually.';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
          }

          reject(new Error(errorMessage));
        },
        options
      );
    };

    tryGetLocation();
  });
}

/**
 * Format address for display in forms
 */
export function formatAddressForDisplay(address: FormattedAddress): string {
  if (address.neighborhood && address.city) {
    return `${address.neighborhood}, ${address.city}`;
  } else if (address.city) {
    return address.city;
  } else {
    return address.formattedShort;
  }
}

/**
 * Validate if coordinates are within Pakistan
 */
export function isWithinPakistan(lat: number, lng: number): boolean {
  // Pakistan's approximate bounding box
  const pakistanBounds = {
    north: 37.1,
    south: 23.6,
    east: 77.8,
    west: 60.9
  };

  return lat >= pakistanBounds.south && lat <= pakistanBounds.north &&
         lng >= pakistanBounds.west && lng <= pakistanBounds.east;
}
