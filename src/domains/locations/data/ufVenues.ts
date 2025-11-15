export interface UFVenue {
  id: string;
  name: string;
  shortName: string;
  type: 'indoor' | 'outdoor';
  sportCategories: string[];
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  popularity: number; // 1-10 scale for how popular this venue is
  facilities?: string[];
}

// UF Gainesville campus venues - focused on popular pickup game locations
export const ufVenues: UFVenue[] = [
  {
    id: 'student-rec-center',
    name: 'Student Recreation & Fitness Center',
    shortName: 'Student Rec',
    type: 'indoor',
    sportCategories: ['basketball', 'volleyball', 'badminton', 'table tennis', 'fitness'],
    latitude: 29.6499,
    longitude: -82.3486,
    address: '1 Fletcher Dr, Gainesville, FL 32611',
    description: 'UF\'s premier indoor sports facility with multiple basketball courts, volleyball courts, and fitness equipment.',
    popularity: 10,
    facilities: ['basketball courts', 'volleyball courts', 'badminton courts', 'table tennis', 'weight room', 'pool']
  },
  {
    id: 'turlington-plaza',
    name: 'Turlington Plaza',
    shortName: 'Turlington Plaza',
    type: 'outdoor',
    sportCategories: ['basketball', 'frisbee', 'pickup games', 'casual sports'],
    latitude: 29.6502,
    longitude: -82.3438,
    address: 'Turlington Plaza, Gainesville, FL 32611',
    description: 'Open plaza area perfect for casual pickup games and outdoor gatherings.',
    popularity: 9,
    facilities: ['basketball hoops', 'open space', 'benches', 'near library']
  },
  {
    id: 'flavet-field',
    name: 'Flavet Field',
    shortName: 'Flavet Field',
    type: 'outdoor',
    sportCategories: ['soccer', 'football', 'flag football', 'baseball', 'softball'],
    latitude: 29.6494,
    longitude: -82.3503,
    address: 'Flavet Field, Gainesville, FL 32611',
    description: 'Large open field used for various sports including soccer and flag football.',
    popularity: 8,
    facilities: ['soccer goals', 'football field markers', 'baseball diamond']
  },
  {
    id: 'southwest-rec-center',
    name: 'Southwest Recreation Center',
    shortName: 'SW Rec',
    type: 'indoor',
    sportCategories: ['basketball', 'volleyball', 'badminton', 'fitness'],
    latitude: 29.6356,
    longitude: -82.3765,
    address: '700 SW 34th St, Gainesville, FL 32607',
    description: 'Secondary recreation center with basketball and volleyball courts.',
    popularity: 7,
    facilities: ['basketball courts', 'volleyball courts', 'fitness center']
  },
  {
    id: 'lake-alice',
    name: 'Lake Alice Area',
    shortName: 'Lake Alice',
    type: 'outdoor',
    sportCategories: ['frisbee', 'casual sports', 'pickup games', 'walking'],
    latitude: 29.6367,
    longitude: -82.3694,
    address: 'Lake Alice, Gainesville, FL 32611',
    description: 'Scenic lake area popular for casual frisbee games and outdoor activities.',
    popularity: 8,
    facilities: ['open fields', 'walking paths', 'picnic areas']
  },
  {
    id: 'plaza-of-americas',
    name: 'Plaza of the Americas',
    shortName: 'Plaza of Americas',
    type: 'outdoor',
    sportCategories: ['basketball', 'pickup games', 'casual sports'],
    latitude: 29.6512,
    longitude: -82.3429,
    address: 'Plaza of the Americas, Gainesville, FL 32611',
    description: 'Central campus plaza with basketball hoops and open space for pickup games.',
    popularity: 9,
    facilities: ['basketball hoops', 'benches', 'open space', 'near dining']
  },
  {
    id: 'norman-field',
    name: 'Norman Field',
    shortName: 'Norman Field',
    type: 'outdoor',
    sportCategories: ['soccer', 'football', 'ultimate frisbee', 'flag football'],
    latitude: 29.6378,
    longitude: -82.3656,
    address: 'Norman Field, Gainesville, FL 32611',
    description: 'Popular field for team sports and ultimate frisbee.',
    popularity: 7,
    facilities: ['soccer goals', 'field markers']
  },
  {
    id: 'reitz-union',
    name: 'Reitz Union Plaza',
    shortName: 'Reitz Union',
    type: 'outdoor',
    sportCategories: ['pickup games', 'casual sports', 'frisbee'],
    latitude: 29.6462,
    longitude: -82.3489,
    address: 'Reitz Union Plaza, Gainesville, FL 32611',
    description: 'Union plaza area with some open space for casual games.',
    popularity: 6,
    facilities: ['open space', 'near union', 'benches']
  },
  {
    id: 'ben-hill-griffin-stadium',
    name: 'Ben Hill Griffin Stadium Area',
    shortName: 'The Swamp',
    type: 'outdoor',
    sportCategories: ['football', 'flag football', 'casual sports'],
    latitude: 29.6507,
    longitude: -82.3489,
    address: 'Ben Hill Griffin Stadium, Gainesville, FL 32611',
    description: 'Area around UF\'s iconic football stadium - great for flag football.',
    popularity: 7,
    facilities: ['open fields', 'near stadium', 'parking areas']
  },
  {
    id: 'uf-track',
    name: 'James G. Pressly Stadium',
    shortName: 'Track Stadium',
    type: 'outdoor',
    sportCategories: ['running', 'track events', 'casual sports'],
    latitude: 29.6497,
    longitude: -82.3539,
    address: 'James G. Pressly Stadium, Gainesville, FL 32611',
    description: 'Track and field facility - great for running and casual sports.',
    popularity: 6,
    facilities: ['running track', 'field space', 'near dorms']
  }
];

// Helper functions for working with UF venues
export const getVenueById = (id: string): UFVenue | undefined => {
  return ufVenues.find(venue => venue.id === id);
};

export const getVenuesBySport = (sport: string): UFVenue[] => {
  return ufVenues.filter(venue =>
    venue.sportCategories.some(category =>
      category.toLowerCase().includes(sport.toLowerCase())
    )
  );
};

export const getPopularVenues = (limit: number = 5): UFVenue[] => {
  return [...ufVenues]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

export const getVenuesByType = (type: 'indoor' | 'outdoor'): UFVenue[] => {
  return ufVenues.filter(venue => venue.type === type);
};

export const searchVenues = (query: string): UFVenue[] => {
  const lowerQuery = query.toLowerCase();
  return ufVenues.filter(venue =>
    venue.name.toLowerCase().includes(lowerQuery) ||
    venue.shortName.toLowerCase().includes(lowerQuery) ||
    venue.sportCategories.some(sport => sport.toLowerCase().includes(lowerQuery))
  );
};

// Get nearby venues based on coordinates (simplified distance calculation)
export const getNearbyVenues = (
  latitude: number,
  longitude: number,
  radiusKm: number = 2
): UFVenue[] => {
  return ufVenues.filter(venue => {
    const distance = getDistanceFromLatLonInKm(latitude, longitude, venue.latitude, venue.longitude);
    return distance <= radiusKm;
  });
};

// Haversine distance calculation
const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
