import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Users, FileDown, Activity, Wallet, RefreshCw, LogOut } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import Spinner from '../components/Spinner';

const API_URL = "https://script.google.com/macros/s/AKfycby37ruZYALb8WuZ7OXJ9_AwCgb-tjJr8R1IFLzZKPB2uWfuhZRNj3nNvMgX0-io2-GR/exec";
const COLORS = ['#50C878', '#F87171', '#FCD34D'];

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [data, setData] = useState({
    summary: { total: 0, hadir: 0, absen: 0, totalDana: 0 },
    headers: [],
    rows: [],
    masterPeserta: []
  });

  const fetchData = async (pwdToUse = adminPass) => {
    if (!pwdToUse && !isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?pwd=${encodeURIComponent(pwdToUse)}`);
      const result = await response.json();

      if (result.status === 'success') {
        setData({
          summary: {
            total: result.data.total,
            hadir: result.data.hadir,
            absen: result.data.absen,
            totalDana: result.data.totalDana
          },
          headers: result.data.headers || [],
          rows: result.data.rows || [],
          masterPeserta: result.data.masterPeserta || []
        });
        return true;
      } else if (result.status === 'unauthorized') {
        Swal.fire({
          icon: 'error',
          title: 'Password Salah',
          text: 'Akses ditolak. Silakan masukkan password yang benar.',
          confirmButtonColor: '#50C878',
          customClass: { popup: 'rounded-2xl' }
        });
        return false;
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal terhubung ke server.',
        confirmButtonColor: '#50C878'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleExportXLSX = () => {
    if (data.rows.length === 0) return;

    // Siapkan data untuk worksheet
    const wsData = [data.headers, ...data.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Peserta");

    // Simpan file
    XLSX.writeFile(wb, `Data_Kesehatan_CPNS_${new Date().getTime()}.xlsx`);
  };

  const handleLogin = async (inputPass) => {
    const success = await fetchData(inputPass);
    if (success) {
      setAdminPass(inputPass);
      setIsAuthenticated(true);
    }
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={handleLogin} />;
  }

  const chartData = [
    { name: 'Hadir', value: data.summary.hadir },
    { name: 'Tidak Hadir', value: data.summary.absen },
  ];

  const submittedNames = data.rows.map(row => String(row[2] || "").trim());
  const belumInput = data.masterPeserta.filter(p => !submittedNames.includes(p.nama));

  const totalPages = Math.ceil(belumInput.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBelumInput = belumInput.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ash-grey pb-12 pt-6 px-4 sm:px-8">
      {isLoading && <Spinner text="Memuat Data..." />}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Action */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white/50 gap-4">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-emerald" />
            Cek Kesehatan CPNS <span className="text-emerald font-normal text-sm ml-1">(Dashboard)</span>
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald/10 text-emerald hover:bg-emerald/20 font-medium rounded-xl transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-2 px-4 py-2 bg-emerald hover:bg-[#3fb866] text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald/20 text-sm"
            >
              <FileDown className="w-4 h-4" /> Export XLSX
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Peserta', value: data.summary.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { title: 'Peserta Hadir', value: data.summary.hadir, icon: Activity, color: 'text-emerald', bg: 'bg-emerald/10' },
            { title: 'Tidak Hadir', value: data.summary.absen, icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
            { title: 'Total Transfer', value: `Rp ${data.summary.totalDana.toLocaleString('id-ID')}`, icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50' }
          ].map((stat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts & Tables Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-1"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6">Persentase Kehadiran</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald"></div> Hadir</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div> Tidak Hadir</div>
            </div>
          </motion.div>

          {/* Table Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6">Data Peserta Lengkap</h3>

            {/* Desktop Table (Hidden on small screens) */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                    <th className="p-4 font-medium rounded-tl-xl">NIP</th>
                    <th className="p-4 font-medium">Nama</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right rounded-tr-xl">Biaya</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.rows.slice(0, 10).map((row, idx) => {
                    const nip = row[1];
                    const nama = row[2];
                    const kehadiran = row[5];
                    const biaya = row[7];

                    return (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-700">{nip}</td>
                        <td className="p-4 text-gray-600">{nama}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${String(kehadiran).toLowerCase().includes('tidak')
                              ? 'bg-red-100 text-red-600'
                              : 'bg-emerald/10 text-emerald'
                            }`}>
                            {kehadiran}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-gray-700">Rp {Number(biaya || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                  {data.rows.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-gray-400">Belum ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {data.rows.length > 10 && (
                <p className="text-center text-xs text-gray-400 mt-4 italic">* Menampilkan 10 data terbaru. Gunakan fitur Export untuk melihat seluruh data.</p>
              )}
            </div>

            {/* Mobile Cards (Visible only on small screens) */}
            <div className="md:hidden space-y-4">
              {data.rows.slice(0, 10).map((row, idx) => {
                const nip = row[1];
                const nama = row[2];
                const kehadiran = row[5];
                const biaya = row[7];

                return (
                  <div key={idx} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{nama}</p>
                        <p className="text-xs text-gray-500 font-mono">{nip}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${String(kehadiran).toLowerCase().includes('tidak')
                          ? 'bg-red-100 text-red-600'
                          : 'bg-emerald/10 text-emerald'
                        }`}>
                        {kehadiran}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-2">
                      <p className="text-xs text-gray-500">Biaya Pemeriksaan</p>
                      <p className="text-sm font-bold text-emerald">Rp {Number(biaya || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                );
              })}
              {data.rows.length === 0 && (
                <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  Belum ada data
                </div>
              )}
            </div>

          </motion.div>
        </div>

        {/* Belum Input Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800">Daftar Peserta Belum Input</h3>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              {belumInput.length} Orang
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBelumInput.map((p, idx) => (
              <div key={idx} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-400 font-bold">
                  {p.nama.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm line-clamp-1">{p.nama}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{p.unit}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-gray-500 font-medium">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}

          {belumInput.length === 0 && data.masterPeserta.length > 0 && (
            <div className="text-center p-8 text-emerald font-medium border-2 border-dashed border-emerald/20 bg-emerald/5 rounded-2xl">
              Luar biasa! Semua peserta telah melakukan input data. 🎉
            </div>
          )}
          {data.masterPeserta.length === 0 && (
            <div className="text-center p-8 text-gray-400">
              Data master peserta belum tersedia.
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
