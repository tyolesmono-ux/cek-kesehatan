import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import Select from 'react-select';
import { FileUp, User, CreditCard, Activity, CheckCircle2 } from 'lucide-react';

const API_URL = "https://script.google.com/macros/s/AKfycby37ruZYALb8WuZ7OXJ9_AwCgb-tjJr8R1IFLzZKPB2uWfuhZRNj3nNvMgX0-io2-GR/exec";

const FormCekKesehatan = ({ setIsLoading }) => {
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    gender: '',
    hamil: false,
    kehadiran: 'Hadir',
    alasan: '',
    buktiBayar: null,
    keterangan: ''
  });

  const [biaya, setBiaya] = useState(708000);
  const [masterData, setMasterData] = useState({ peserta: [], submitted: [] });
  const [isFetchingMaster, setIsFetchingMaster] = useState(true);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const response = await fetch(API_URL + "?action=master");
        const result = await response.json();
        if (result.status === 'success') {
          setMasterData({
            peserta: result.data.masterPeserta || [],
            submitted: result.data.submittedNames || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch master data", err);
      } finally {
        setIsFetchingMaster(false);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (formData.gender === 'Perempuan' && formData.hamil) {
      setBiaya(608000);
    } else {
      setBiaya(708000);
    }
  }, [formData.gender, formData.hamil]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'nip') {
      const maskedValue = value.replace(/\D/g, '').slice(0, 18);
      setFormData(prev => ({ ...prev, nip: maskedValue }));
      return;
    }

    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      return;
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (name === 'gender' && value === 'Laki-laki') {
      setFormData(prev => ({ ...prev, hamil: false }));
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama) {
      Swal.fire({
        icon: 'error',
        title: 'Nama Kosong',
        text: 'Silakan cari dan pilih nama Anda dari daftar.',
        confirmButtonColor: '#50C878'
      });
      return;
    }

    if (formData.nip.length !== 18) {
      Swal.fire({
        icon: 'error',
        title: 'NIP Tidak Valid',
        text: 'NIP harus terdiri dari 18 digit angka.',
        confirmButtonColor: '#50C878'
      });
      return;
    }

    // Cek duplikasi via database
    if (masterData.submitted.includes(formData.nama)) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Sudah Ada',
        text: 'Nama Anda sudah terdaftar di sistem. Anda tidak dapat melakukan input dua kali.',
        confirmButtonColor: '#50C878'
      });
      return;
    }

    setIsLoading(true);

    try {
      let fileBase64 = '';
      let fileName = '';
      let mimeType = '';

      if (formData.buktiBayar && formData.kehadiran === 'Hadir') {
        fileBase64 = await toBase64(formData.buktiBayar);
        fileName = formData.buktiBayar.name;
        mimeType = formData.buktiBayar.type;
      }

      const payload = {
        nip: formData.nip,
        nama: formData.nama,
        gender: formData.gender,
        statusHamil: formData.hamil ? 'Ya' : 'Tidak',
        kehadiran: formData.kehadiran,
        alasanAbsen: formData.kehadiran === 'Tidak Hadir' ? formData.alasan : '',
        nominalBayar: formData.kehadiran === 'Hadir' ? biaya : 0,
        keterangan: formData.keterangan,
        fileBase64,
        fileName,
        mimeType
      };
      
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        }
      });

      const result = await response.json();

      setIsLoading(false);

      if (result.status === "success") {
        // Update submitted state array to prevent duplicate on same session without refresh
        setMasterData(prev => ({
          ...prev,
          submitted: [...prev.submitted, formData.nama]
        }));

        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data Anda telah berhasil disimpan.',
          confirmButtonColor: '#50C878',
          customClass: {
            popup: 'rounded-2xl',
          }
        });
        
        // Reset form
        setFormData({
          nip: '',
          nama: '',
          gender: '',
          hamil: false,
          kehadiran: 'Hadir',
          alasan: '',
          buktiBayar: null,
          keterangan: ''
        });
      } else {
        throw new Error(result.message || "Terjadi kesalahan pada server");
      }
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.message || 'Gagal terhubung ke server. Silakan coba lagi.',
        confirmButtonColor: '#50C878'
      });
    }
  };

  const namaOptions = masterData.peserta
    .filter(p => !masterData.submitted.includes(p.nama))
    .map(p => ({
      value: p.nama,
      label: p.unit ? `${p.nama} - ${p.unit}` : p.nama
    }));

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 space-y-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald" />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald" />
          Nomor Induk Pegawai (NIP)
        </label>
        <input
          type="text"
          name="nip"
          required
          value={formData.nip}
          onChange={handleChange}
          placeholder="Masukkan 18 Digit NIP"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white"
        />
        <p className="text-xs text-gray-500 mt-1.5 ml-1">
          {formData.nip.length}/18 karakter
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald" />
          Nama Lengkap
        </label>
        <Select
          options={namaOptions}
          isLoading={isFetchingMaster}
          placeholder={isFetchingMaster ? "Memuat data peserta..." : "Ketik untuk mencari nama..."}
          onChange={(selected) => setFormData(prev => ({ ...prev, nama: selected ? selected.value : '' }))}
          value={namaOptions.find(o => o.value === formData.nama) || null}
          styles={{
            control: (base, state) => ({
              ...base,
              padding: '4px',
              borderRadius: '0.75rem',
              borderColor: state.isFocused ? '#50C878' : '#E5E7EB',
              boxShadow: state.isFocused ? '0 0 0 2px rgba(80, 200, 120, 0.2)' : 'none',
              '&:hover': {
                borderColor: '#50C878'
              },
              backgroundColor: 'rgba(249, 250, 251, 0.5)'
            })
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Kelamin</label>
          <select
            name="gender"
            required
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white appearance-none cursor-pointer"
          >
            <option value="">Pilih Jenis Kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kehadiran</label>
          <select
            name="kehadiran"
            required
            value={formData.kehadiran}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white appearance-none cursor-pointer"
          >
            <option value="Hadir">Hadir</option>
            <option value="Tidak Hadir">Tidak Hadir</option>
          </select>
        </div>
      </div>

      <AnimatePresence>
        {formData.gender === 'Perempuan' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <label className="flex items-center gap-3 p-4 border border-emerald/30 bg-emerald/5 rounded-xl cursor-pointer hover:bg-emerald/10 transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="hamil"
                  checked={formData.hamil}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-emerald focus:ring-emerald cursor-pointer"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">Saya sedang dalam kondisi hamil</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {formData.kehadiran === 'Hadir' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4 pt-2"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FileUp className="w-4 h-4 text-emerald" />
                Upload Bukti Pembayaran
              </label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-emerald transition-colors bg-gray-50/50 text-center cursor-pointer">
                <input
                  type="file"
                  name="buktiBayar"
                  required
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,.pdf"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <FileUp className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600 font-medium">
                    {formData.buktiBayar ? formData.buktiBayar.name : 'Klik atau drag file ke sini'}
                  </p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG (Max. 2MB)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald/5 border border-emerald/20 rounded-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald" />
                  <span className="text-sm font-medium text-gray-700">Biaya Pemeriksaan</span>
                </div>
                <span className="text-xl font-bold text-emerald">
                  Rp {biaya.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="alasan"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2"
          >
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alasan Tidak Hadir
            </label>
            <textarea
              name="alasan"
              required
              value={formData.alasan}
              onChange={handleChange}
              rows="3"
              placeholder="Berikan alasan yang jelas..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Keterangan Tambahan (Opsional)
        </label>
        <textarea
          name="keterangan"
          value={formData.keterangan}
          onChange={handleChange}
          rows="2"
          placeholder="Misal: Request urutan antrian khusus, dsb."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all outline-none bg-gray-50/50 hover:bg-white resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-emerald hover:bg-[#3fb866] text-white font-medium py-3.5 px-4 rounded-xl shadow-lg shadow-emerald/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        Kirim Data Pemeriksaan
      </button>
    </motion.form>
  );
};

export default FormCekKesehatan;
