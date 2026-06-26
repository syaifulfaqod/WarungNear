import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import useAuthStore from '../store/useAuthStore';
import useTourStore from '../store/useTourStore';

const TourGuide = ({ role }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { run, setRun } = useTourStore();
  const [activeSteps, setActiveSteps] = useState([]);

  // Check if tour should run automatically on login
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRun(false);
      return;
    }

    const key = `tour_${role.toLowerCase()}_completed_${user.id}`;
    const isCompleted = localStorage.getItem(key);

    if (!isCompleted) {
      // Delay to ensure components are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, role, setRun]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      if (user) {
        const key = `tour_${role.toLowerCase()}_completed_${user.id}`;
        localStorage.setItem(key, 'true');
      }
      setRun(false);
      console.log(`Tour onboarding completed for role: ${role}`);
    }
  };

  const customerSteps = [
    {
      target: '#tour-navbar',
      title: '🧭 Navigasi Menu',
      content: 'Gunakan menu navigasi ini untuk mencari toko, produk, chat, dan pesanan Anda.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-search-link',
      title: '🔍 Cari Produk',
      content: 'Gunakan fitur pencarian untuk menemukan barang yang Anda butuhkan.',
      placement: 'bottom',
    },
    {
      target: '#tour-maps-link',
      title: '📍 Toko Terdekat (Maps)',
      content: 'Gunakan halaman maps untuk melihat toko terdekat berdasarkan lokasi Anda.',
      placement: 'bottom',
    },
    {
      target: '#tour-store-card',
      title: '🏪 Toko Kelontong',
      content: 'Klik toko untuk melihat detail toko, jam buka, lokasi, produk, dan kontak.',
      placement: 'bottom',
    },
    {
      target: '#tour-cart-link',
      title: '🛒 Keranjang Belanja',
      content: 'Tambahkan barang ke keranjang sebelum melakukan checkout.',
      placement: 'bottom',
    },
    {
      target: '#tour-chat-link',
      title: '💬 Chat Toko',
      content: 'Gunakan fitur chat untuk bertanya kepada toko sebelum membeli.',
      placement: 'bottom',
    },
    {
      target: '#tour-orders-link',
      title: '📦 Pesanan Saya',
      content: 'Lihat status pesanan dan riwayat pembelian Anda di sini.',
      placement: 'bottom',
    },
    {
      target: '#tour-profile-menu',
      title: '👤 Profil Akun',
      content: 'Kelola akun Anda melalui menu profile.',
      placement: 'bottom',
    }
  ];

  const ownerSteps = [
    {
      target: '#tour-owner-dashboard',
      title: '📊 Ringkasan Dashboard',
      content: 'Pantau perkembangan toko, pendapatan, dan statistik penjualan.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#tour-owner-products',
      title: '🍎 Manajemen Produk',
      content: 'Tambahkan, edit, dan kelola produk toko Anda.',
      placement: 'right',
    },
    {
      target: '#tour-owner-categories',
      title: '🏷️ Kategori Produk',
      content: 'Buat kategori produk agar barang lebih mudah dicari.',
      placement: 'right',
    },
    {
      target: '#tour-owner-inventory',
      title: '📦 Manajemen Stok',
      content: 'Kelola stok barang toko Anda.',
      placement: 'right',
    },
    {
      target: '#tour-owner-orders',
      title: '🛒 Pesanan Masuk',
      content: 'Kelola pesanan customer yang masuk.',
      placement: 'right',
    },
    {
      target: '#tour-owner-pos',
      title: '🖥️ Kasir POS (Point of Sales)',
      content: 'Gunakan POS untuk transaksi langsung di toko.\n\nFitur POS hanya aktif jika langganan masih aktif.',
      placement: 'right',
    },
    {
      target: '#tour-owner-chat',
      title: '💬 Chat Customer',
      content: 'Balas pertanyaan customer melalui chat toko.',
      placement: 'right',
    },
    {
      target: '#tour-owner-reports',
      title: '📈 Laporan Penjualan',
      content: 'Lihat laporan transaksi dan pendapatan toko.',
      placement: 'right',
    },
    {
      target: '#tour-owner-settings',
      title: '⚙️ Pengaturan Toko',
      content: 'Atur informasi toko, lokasi maps, jam operasional, nomor WhatsApp, dan data lainnya.',
      placement: 'right',
    },
    {
      target: '#tour-owner-subscription',
      title: '💳 Status Langganan',
      content: 'Kelola paket langganan toko Anda.',
      placement: 'bottom',
    }
  ];

  const adminSteps = [
    {
      target: '#tour-admin-dashboard',
      title: '📊 Dashboard Admin',
      content: 'Pantau aktivitas sistem.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#tour-admin-users',
      title: '👥 Manajemen Pengguna',
      content: 'Kelola akun customer, owner, dan admin.',
      placement: 'right',
    },
    {
      target: '#tour-admin-stores',
      title: '🏪 Manajemen Toko',
      content: 'Kelola data toko yang terdaftar.',
      placement: 'right',
    },
    {
      target: '#tour-admin-payments',
      title: '💳 Verifikasi Pembayaran',
      content: 'Verifikasi pembayaran langganan owner.',
      placement: 'right',
    },
    {
      target: '#tour-admin-reports',
      title: '📈 Laporan Sistem',
      content: 'Lihat laporan sistem.',
      placement: 'right',
    }
  ];

  const getSteps = () => {
    switch (role) {
      case 'ADMIN':
        return adminSteps;
      case 'OWNER':
        return ownerSteps;
      case 'CUSTOMER':
      default:
        return customerSteps;
    }
  };

  useEffect(() => {
    if (run) {
      const steps = getSteps();
      const filtered = steps.filter(step => {
        try {
          return document.querySelector(step.target) !== null;
        } catch (e) {
          return false;
        }
      });
      setActiveSteps(filtered);
    } else {
      setActiveSteps([]);
    }
  }, [run, role]);

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={run && activeSteps.length > 0}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={activeSteps}
      locale={{
        back: 'Sebelumnya',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Berikutnya',
        open: 'Buka dialog',
        skip: 'Lewati'
      }}
      styles={{
        options: {
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(15, 23, 42, 0.65)', // Darker professional overlay
          primaryColor: '#16A34A', // Brand green
          textColor: '#1e293b',
          zIndex: 9999,
        },
        tooltip: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          padding: '16px',
          animation: 'fade-in 0.3s ease-out',
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          borderRadius: '10px',
          fontWeight: 'bold',
          padding: '8px 16px',
          fontSize: '13px',
          backgroundColor: '#16A34A',
          transition: 'all 0.2s',
          cursor: 'pointer',
        },
        buttonBack: {
          marginRight: '8px',
          color: '#64748b',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#94a3b8',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
        }
      }}
    />
  );
};

export default TourGuide;
