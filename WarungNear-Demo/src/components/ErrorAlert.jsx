import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto my-8 shadow-sm">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="font-bold text-text text-lg mb-1">Gagal Memuat Data</h3>
      <p className="text-gray-600 text-sm mb-5">
        {message || 'Koneksi ke server terganggu atau terjadi kesalahan sistem.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center bg-primary hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2 animate-spin-hover" />
          Coba Lagi
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
