import React, { useEffect, useState } from 'react';
import { CreditCard, FileImage, ShieldCheck, AlertCircle, RefreshCw, MessageSquare, UploadCloud, CheckCircle, Award, Copy, FileText } from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { getImageUrl } from '../../services/api';
import { toast } from 'react-hot-toast';

const Subscription = () => {
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPlansAndStatus = async () => {
    setLoading(true);
    try {
      const statusRes = await subscriptionService.getSubscriptionStatus();
      if (statusRes.success) {
        setSubStatus(statusRes.data);
      }
      
      const plansRes = await subscriptionService.getSubscriptionPlans();
      if (plansRes.success) {
        setPlans(plansRes.data);
        // Default select monthly plan if available and user is in trial/expired
        if (plansRes.data.length > 0) {
          setSelectedPlan(plansRes.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data langganan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndStatus();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error('Hanya diperbolehkan mengunggah file gambar (JPG, JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Silakan pilih paket langganan terlebih dahulu.');
      return;
    }
    if (!selectedFile) {
      toast.error('Silakan pilih bukti pembayaran terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await subscriptionService.submitPayment(selectedPlan.id, selectedFile);
      if (res.success) {
        toast.success(res.message);
        setSelectedFile(null);
        setPreviewUrl(null);
        await fetchPlansAndStatus();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengirim bukti pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memuat data langganan...</p>
      </div>
    );
  }

  const getStatusCard = () => {
    if (!subStatus) return null;

    let title = '';
    let description = '';
    let icon = null;
    let cardClass = '';

    switch (subStatus.status) {
      case 'TRIAL':
        title = 'Masa Percobaan Gratis (Free Trial)';
        description = subStatus.daysRemaining > 0
          ? `Status akun Anda berada dalam masa trial. Anda memiliki ${subStatus.daysRemaining} hari tersisa untuk menggunakan semua fitur premium.`
          : 'Masa trial Anda telah habis. Silakan bayar langganan untuk melanjutkan menggunakan fitur Kasir POS.';
        icon = <ShieldCheck className="w-12 h-12 text-amber-500" />;
        cardClass = 'border-amber-200 bg-amber-50/30';
        break;
      case 'ACTIVE':
        if (subStatus.plan?.duration_type === 'PERMANENT') {
          title = 'Langganan Permanen (Aktif Selamanya)';
          description = 'Terima kasih! Akun Anda aktif secara permanen. Anda dapat menggunakan semua fitur premium dan POS Kasir WarungNear selamanya tanpa batas waktu.';
          icon = <Award className="w-12 h-12 text-amber-500 animate-pulse" />;
          cardClass = 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-350';
        } else {
          title = `Langganan Premium Aktif (${subStatus.plan?.name || 'Aktif'})`;
          description = `Akun Anda aktif. Terima kasih atas dukungan Anda! Masa langganan aktif hingga ${new Date(subStatus.expiredDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;
          icon = <ShieldCheck className="w-12 h-12 text-green-500" />;
          cardClass = 'border-green-200 bg-green-50/30';
        }
        break;
      case 'PENDING':
        title = 'Menunggu Verifikasi Admin';
        description = 'Bukti pembayaran Anda telah diunggah dan sedang dalam antrean verifikasi oleh Administrator. Fitur premium akan diaktifkan segera setelah disetujui.';
        icon = <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />;
        cardClass = 'border-blue-200 bg-blue-50/30';
        break;
      case 'EXPIRED':
        title = 'Masa Langganan Habis';
        description = 'Langganan premium Anda sudah kedaluwarsa. Transaksi Kasir POS dibatasi sampai pembayaran diselesaikan.';
        icon = <AlertCircle className="w-12 h-12 text-red-500" />;
        cardClass = 'border-red-200 bg-red-50/30';
        break;
      default:
        break;
    }

    return (
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xs ${cardClass} flex flex-col md:flex-row items-center md:items-start gap-6`}>
        <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          {subStatus.status === 'TRIAL' && subStatus.daysRemaining > 0 && (
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full border border-amber-200">
              {subStatus.daysRemaining} hari lagi
            </span>
          )}
          {subStatus.status === 'ACTIVE' && subStatus.plan?.duration_type !== 'PERMANENT' && (
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-black rounded-full border border-green-200">
              Aktif
            </span>
          )}
          {subStatus.status === 'ACTIVE' && subStatus.plan?.duration_type === 'PERMANENT' && (
            <span className="inline-block px-3 py-1 bg-amber-150 text-amber-900 text-xs font-black rounded-full border border-amber-300">
              Lifetime Aktif
            </span>
          )}
        </div>
      </div>
    );
  };

  const getPlanCardStyle = (plan) => {
    const isSelected = selectedPlan?.id === plan.id;
    const baseStyle = "border-2 rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-xs relative overflow-hidden ";
    
    let colorStyle = "";
    if (plan.duration_type === 'MONTHLY') {
      colorStyle = isSelected 
        ? "border-green-600 bg-green-50/30 ring-2 ring-green-600" 
        : "border-gray-150 hover:border-green-300 bg-white";
    } else if (plan.duration_type === 'YEARLY') {
      colorStyle = isSelected 
        ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-600" 
        : "border-gray-150 hover:border-blue-300 bg-white";
    } else if (plan.duration_type === 'PERMANENT') {
      colorStyle = isSelected 
        ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500" 
        : "border-gray-150 hover:border-amber-300 bg-white";
    }

    return baseStyle + colorStyle;
  };

  const getPlanBadge = (plan) => {
    if (plan.duration_type === 'MONTHLY') {
      return <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full">Bulanan</span>;
    } else if (plan.duration_type === 'YEARLY') {
      return <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">Paling Hemat</span>;
    } else if (plan.duration_type === 'PERMANENT') {
      return <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-amber-150 text-amber-900 text-[10px] font-bold rounded-full flex items-center gap-0.5">⭐ Permanen</span>;
    }
    return null;
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText('016301143106507');
    setCopied(true);
    toast.success('Nomor rekening berhasil disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  const showBuyForm = subStatus && !subStatus.hasPending && (
    subStatus.status === 'EXPIRED' ||
    subStatus.status === 'TRIAL' ||
    (subStatus.status === 'ACTIVE' && isExtending && subStatus.plan?.duration_type !== 'PERMANENT')
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flexible Premium Packages</h1>
        <p className="text-sm text-gray-500 mt-1">Upgrade warung Anda dengan paket langganan bulanan, tahunan, atau permanen</p>
      </div>

      {getStatusCard()}

      {subStatus && subStatus.hasPending && (
        <div className="p-6 bg-blue-50/50 border border-blue-200 rounded-3xl flex items-center gap-4 shadow-2xs">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin shrink-0" />
          <div className="space-y-1 text-left">
            <p className="font-extrabold text-blue-900 text-sm">Perpanjangan Menunggu Verifikasi Admin</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Bukti transfer perpanjangan paket Anda sudah dikirim dan sedang dalam proses verifikasi oleh Administrator. 
              Kasir POS Anda tetap dapat digunakan secara normal selama masa aktif saat ini belum habis.
            </p>
          </div>
        </div>
      )}

      {showBuyForm && (
        <div className="space-y-6 animate-fade-in">
          {/* Plan Selection Grid */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h3 className="font-extrabold text-lg text-gray-900">1. Pilih Paket Langganan</h3>
              {(subStatus.status === 'ACTIVE' || subStatus.status === 'TRIAL') && (
                <div className="p-3 bg-green-50 text-green-800 rounded-xl border border-green-150 text-xs font-semibold text-left">
                  ℹ Pembelian baru akan ditambahkan ke masa aktif yang sedang berjalan (akumulatif setelah masa aktif saat ini berakhir).
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={getPlanCardStyle(plan)}
                >
                  {getPlanBadge(plan)}
                  <div className="space-y-2 pr-12">
                    <h4 className="font-extrabold text-base text-gray-800">{plan.name}</h4>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed">{plan.description}</p>
                  </div>
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 font-bold uppercase">Harga</p>
                    <p className="text-xl font-black text-primary mt-1">
                      {formatRupiah(plan.price)}
                      <span className="text-xs font-bold text-gray-450 normal-case"> 
                        {plan.duration_type === 'MONTHLY' ? ' / bulan' : plan.duration_type === 'YEARLY' ? ' / tahun' : ' sekali bayar'}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-450 mt-0.5 font-semibold">
                      {plan.duration_type === 'PERMANENT' ? 'Aktif selamanya tanpa expired' : `Aktif ${plan.duration_days} hari`}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button 
                      className={`w-full py-2 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border ${
                        selectedPlan?.id === plan.id 
                          ? 'bg-primary text-white border-transparent' 
                          : 'bg-white text-gray-550 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {selectedPlan?.id === plan.id && <CheckCircle className="w-3.5 h-3.5" />}
                      {selectedPlan?.id === plan.id ? 'Paket Terpilih' : 'Pilih Paket'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedPlan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Instructions */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-xs space-y-6">
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  2. Instruksi Transfer Bank
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-550 font-semibold uppercase">Total Pembayaran ({selectedPlan.name})</p>
                    <p className="text-2xl font-black text-primary mt-1">{formatRupiah(selectedPlan.price)}</p>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600">
                    <p className="font-bold text-gray-800">Silakan transfer pembayaran ke:</p>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <p className="font-extrabold text-blue-700 text-sm md:text-base">Bank BRI</p>
                        <p className="font-mono text-gray-850 font-black tracking-wider text-base md:text-lg">016301143106507</p>
                        <p className="text-[10px] md:text-xs text-gray-550 font-semibold uppercase">a.n. SYAIFUL HIDAYAT</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyRekening}
                        className="p-2.5 bg-white hover:bg-blue-100 text-blue-600 rounded-xl border border-blue-200 transition-all hover:scale-105 shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="Copy Nomor Rekening"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-650" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-xs font-bold hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2 mt-4 text-left">
                      <p className="font-semibold text-gray-800">Catatan Penting:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Transfer nominal tepat sebesar <strong className="text-gray-800">{formatRupiah(selectedPlan.price)}</strong>.</li>
                        <li>Simpan bukti transfer dalam format JPG, JPEG, PNG, atau WEBP.</li>
                        <li>Setelah transfer selesai, unggah bukti pembayaran di formulir sebelah kanan.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 text-left">
                  <p className="text-xs text-gray-550 font-semibold">Butuh bantuan manual?</p>
                  <a 
                    href={`https://wa.me/6282331099074`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#16A34A] hover:underline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Hubungi Admin WhatsApp (082331099074)
                  </a>
                </div>
              </div>

              {/* Upload Form */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-primary" />
                    3. Unggah Bukti Pembayaran
                  </h3>
                  
                  <p className="text-sm text-gray-550 text-left">
                    Kirimkan foto struk pembayaran untuk paket <strong className="text-gray-800">{selectedPlan.name}</strong> di bawah ini agar diverifikasi admin.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6 cursor-pointer hover:bg-gray-50/50 transition-colors">
                      <input 
                        type="file" 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                        disabled={submitting}
                      />
                      {previewUrl ? (
                        <div className="relative group w-full flex flex-col items-center">
                          <img 
                            src={previewUrl} 
                            alt="Bukti Transfer Preview" 
                            className="max-h-48 rounded-xl object-contain border border-gray-200"
                          />
                          <span className="text-xs text-gray-500 font-semibold mt-3 underline group-hover:text-primary">
                            Ubah File Bukti
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <FileImage className="w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold text-gray-700">Pilih Bukti Pembayaran</span>
                            <p className="text-xs text-gray-400 mt-1">JPG, JPEG, PNG atau WEBP (Maksimal 5MB)</p>
                          </div>
                        </div>
                      )}
                    </label>

                    {selectedFile && (
                      <div className="p-3 bg-gray-55/10 rounded-xl flex items-center justify-between text-xs text-gray-650">
                        <span className="font-bold truncate max-w-[200px]">{selectedFile.name}</span>
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !selectedFile}
                    className={`w-full py-3.5 px-4 font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${
                      submitting || !selectedFile
                        ? 'bg-gray-100 text-gray-450 border border-gray-200'
                        : 'bg-primary text-white hover:bg-green-700 shadow-sm'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      `Kirim Bukti untuk ${selectedPlan.name}`
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {subStatus && subStatus.status === 'ACTIVE' && (
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-xs flex flex-col items-center text-center space-y-4 py-10">
          <span className="text-4xl">🎉</span>
          <h3 className="font-extrabold text-xl text-gray-900">
            {subStatus.plan?.duration_type === 'PERMANENT' 
              ? 'Selamat! Anda Memiliki Akses Permanen' 
              : `Akses Premium ${subStatus.plan?.name || 'Aktif'}!`}
          </h3>
          <div className="text-sm text-gray-555 max-w-lg leading-relaxed space-y-1">
            <p>
              {subStatus.plan?.duration_type === 'PERMANENT' 
                ? 'Akun premium Anda saat ini aktif selamanya. POS Kasir, inventaris, chat customer, dan laporan analitik penjualan dapat diakses selamanya tanpa batasan bulanan.'
                : `Akun premium Anda saat ini aktif. Semua fitur premium, termasuk POS Kasir, inventaris lengkap, kategori dinamis, dan laporan penjualan, dapat digunakan sepenuhnya.`}
            </p>
            {subStatus.plan?.duration_type !== 'PERMANENT' && subStatus.expiredDate && (
              <p className="font-extrabold text-gray-800 pt-1">
                Berlaku sampai: {new Date(subStatus.expiredDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          
          {subStatus.plan?.duration_type === 'PERMANENT' ? (
            <div className="mt-4 px-4 py-2 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl">
              ⭐ Anda sudah menggunakan paket permanen
            </div>
          ) : (
            !subStatus.hasPending && !isExtending && (
              <div className="pt-4">
                <button 
                  onClick={() => setIsExtending(true)}
                  className="px-6 py-3 bg-primary hover:bg-green-700 text-white text-xs font-extrabold rounded-2xl shadow-xs transition-all cursor-pointer"
                >
                  Perpanjang Langganan
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* History log table */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs p-6 md:p-8 space-y-4">
        <h3 className="font-extrabold text-base md:text-lg text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Riwayat Perpanjangan Langganan
        </h3>
        
        {!subStatus.history || subStatus.history.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat pembelian paket langganan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal Pembelian</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Masa Aktif Tambahan</th>
                  <th className="py-3 px-4">Berlaku Sampai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {subStatus.history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-3 px-4 font-black text-gray-900">{item.planName}</td>
                    <td className="py-3 px-4 font-bold">{formatRupiah(item.planPrice)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        item.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                        item.status === 'PENDING' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status === 'ACTIVE' ? 'Disetujui' : item.status === 'PENDING' ? 'Pending' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {item.durationDays ? `+${item.durationDays} hari` : 'Lifetime'}
                    </td>
                    <td className="py-3 px-4 text-gray-550 font-semibold">
                      {item.status === 'ACTIVE' ? (
                        item.expiredDateAfter ? new Date(item.expiredDateAfter).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Lifetime'
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
