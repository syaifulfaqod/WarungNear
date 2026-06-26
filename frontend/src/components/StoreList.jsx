import React from 'react';
import StoreCard from './StoreCard';
import EmptyState from './EmptyState';

const StoreList = ({ stores, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="card h-32 animate-pulse flex">
            <div className="w-32 bg-gray-200 h-full"></div>
            <div className="flex-1 p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stores || stores.length === 0) {
    return <EmptyState message="Tidak ada toko terdekat di sekitar Anda" />;
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
};

export default StoreList;
