import { create } from 'zustand';

const useSearchStore = create((set) => ({
  searchKeyword: '',
  categoryFilter: 'Semua',
  distanceFilter: 5, // in km
  sortBy: 'Terdekat', // 'Terdekat', 'Stok terbanyak', 'Harga termurah'
  userLocation: { lat: null, lng: null, latitude: null, longitude: null, accuracy: null },
  selectedStore: null,

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setDistanceFilter: (distance) => set({ distanceFilter: distance }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setUserLocation: (location) => set({ userLocation: location }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  resetFilters: () => set({
    searchKeyword: '',
    categoryFilter: 'Semua',
    distanceFilter: 5,
    sortBy: 'Terdekat'
  })
}));

export default useSearchStore;
