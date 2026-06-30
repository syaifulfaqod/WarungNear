import React from 'react';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

const ProductGrid = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="card h-64 animate-pulse flex flex-col p-0">
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState message="Tidak ada produk yang ditemukan" />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
