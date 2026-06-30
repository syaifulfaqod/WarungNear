import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} WarungNear. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
