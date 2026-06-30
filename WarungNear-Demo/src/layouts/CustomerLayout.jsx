import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TourGuide from '../components/TourGuide';

const CustomerLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <TourGuide role="CUSTOMER" />
      <Navbar />
      <main className="flex-grow bg-background">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
