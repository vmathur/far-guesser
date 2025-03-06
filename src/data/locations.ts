import { Location } from '../components/types/LocationGuesserTypes';

// Array of interesting locations for guessing
export const locations: Location[] = [
  { position: { lat: 40.7580, lng: -73.9855 }, answer: 'New York', hint: 'Times Square' },
  { position: { lat: 48.858093, lng: 2.294694 }, answer: 'Paris', hint: 'Near Eiffel Tower' },
  { position: { lat: 51.510020, lng: -0.134730 }, answer: 'London', hint: 'Near Hyde Park' },
  { position: { lat: 1.283404, lng: 103.863134 }, answer: 'Singapore', hint: 'Marina Bay' },
  { position: { lat: 37.809307, lng: -122.475891 }, answer: 'San Francisco', hint: 'Golden Gate Bridge' },
  { position: { lat: 35.6595, lng: 139.7004 }, answer: 'Tokyo', hint: 'Shibuya Crossing' },
  { position: { lat: -33.8567, lng: 151.2131 }, answer: 'Sydney', hint: 'Near Sydney Opera House' },
]; 