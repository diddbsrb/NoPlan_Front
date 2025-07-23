import { apiClient } from './apiClient';

export const travelService = {
  fetchTrips: () => apiClient.get('/trips'),
  createTrip: (data: any) => apiClient.post('/trips', data),
  // updateTrip, deleteTrip 등 필요에 따라 추가
}; 