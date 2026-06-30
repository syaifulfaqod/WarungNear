import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ title = "Data Kosong", message = "Tidak ada data yang dapat ditampilkan." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <PackageOpen className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
