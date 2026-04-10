import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  FileCheck, 
  LayoutDashboard, 
  GraduationCap, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Menu,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Activity,
  CreditCard,
  Upload,
  FileText,
  FileDown,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type Section = 'dashboard' | 'profil' | 'orangtua' | 'registrasi' | 'periodik' | 'kurang_mampu' | 'verval' | 'notifikasi';

const allMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profil', label: 'Profil Saya', icon: User },
  { id: 'orangtua', label: 'Data Orang Tua', icon: Users },
  { id: 'registrasi', label: 'Registrasi Peserta Didik', icon: GraduationCap },
  { id: 'periodik', label: 'Data Periodik', icon: Activity },
  { id: 'kurang_mampu', label: 'Siswa Kurang Mampu', icon: CreditCard },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
  { id: 'verval', label: 'Verval Data', icon: FileCheck },
];

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRAyzDE44XBJ6Zjztd6nUISIePiwt1J8YfEx7MpXr6pg1rQlfR_VkPe0Ax0OYvT5LT/exec';

function StatusModal({ show, type, message, onClose }: { show: boolean, type: 'success' | 'error', message: string, onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-1.5 ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {type === 'success' ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {type === 'success' ? 'Berhasil!' : 'Gagal!'}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  type === 'success' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                }`}
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nisnInput, setNisnInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const religionMapping = { '1': 'Islam', '2': 'Kristen', '3': 'Katholik', '4': 'Hindu', '5': 'Budha', '6': 'Khonghucu', '7': 'Kepercayaan kpd Tuhan YME', '99': 'Lainnya' };
  const stayMapping = { '1': 'Bersama orang tua', '2': 'Wali', '3': 'Kost', '4': 'Asrama', '5': 'Panti asuhan', '10': 'Pesantren', '99': 'Lainnya' };
  const transportMapping = { '1': 'Jalan kaki', '3': 'Angkutan umum/bus/pete-pete', '4': 'Mobil/bus antar jemput', '6': 'Ojek', '7': 'Andong/bendi/sado/dokar/delman/becak', '8': 'Perahu penyeberangan/rakit/getek', '12': 'Sepeda', '13': 'Sepeda motor', '14': 'Mobil pribadi', '99': 'Lainnya' };
  
  const eduMapping = [
    { value: '0', label: 'Tidak sekolah' }, { value: '1', label: 'PAUD' }, { value: '2', label: 'TK / sederajat' },
    { value: '3', label: 'Putus SD' }, { value: '4', label: 'SD / sederajat' }, { value: '5', label: 'SMP / sederajat' },
    { value: '6', label: 'SMA / sederajat' }, { value: '7', label: 'Paket A' }, { value: '8', label: 'Paket B' },
    { value: '9', label: 'Paket C' }, { value: '20', label: 'D1' }, { value: '21', label: 'D2' },
    { value: '22', label: 'D3' }, { value: '23', label: 'D4' }, { value: '30', label: 'S1' },
    { value: '31', label: 'Profesi' }, { value: '32', label: 'Sp-1' }, { value: '35', label: 'S2' },
    { value: '36', label: 'S2 Terapan' }, { value: '37', label: 'Sp-2' }, { value: '40', label: 'S3' },
    { value: '41', label: 'S3 Terapan' }, { value: '90', label: 'Non formal' }, { value: '91', label: 'Informal' }, { value: '99', label: 'Lainnya' }
  ];

  const jobMapping = [
    { value: '1', label: 'Tidak bekerja' }, { value: '2', label: 'Nelayan' }, { value: '3', label: 'Petani' },
    { value: '4', label: 'Peternak' }, { value: '5', label: 'PNS/TNI/Polri' }, { value: '6', label: 'Karyawan Swasta' },
    { value: '7', label: 'Pedagang Kecil' }, { value: '8', label: 'Pedagang Besar' }, { value: '9', label: 'Wiraswasta' },
    { value: '10', label: 'Wirausaha' }, { value: '11', label: 'Buruh' }, { value: '12', label: 'Pensiunan' },
    { value: '13', label: 'Tenaga Kerja Indonesia' }, { value: '14', label: 'Karyawan BUMN' },
    { value: '90', label: 'Tidak dapat diterapkan' }, { value: '98', label: 'Sudah Meninggal' }, { value: '99', label: 'Lainnya' }
  ];

  const incomeMapping = [
    { value: '11', label: 'Kurang dari Rp. 500,000' }, { value: '12', label: 'Rp. 500,000 - Rp. 999,999' },
    { value: '13', label: 'Rp. 1,000,000 - Rp. 1,999,999' }, { value: '14', label: 'Rp. 2,000,000 - Rp. 4,999,999' },
    { value: '15', label: 'Rp. 5,000,000 - Rp. 20,000,000' }, { value: '16', label: 'Lebih dari Rp. 20,000,000' },
    { value: '99', label: 'Tidak Berpenghasilan' }
  ];

  const hobbyMapping = [
    { value: '1', label: 'Olah Raga' }, { value: '2', label: 'Kesenian' }, { value: '3', label: 'Membaca' },
    { value: '4', label: 'Menulis' }, { value: '5', label: 'Traveling' }, { value: '6', label: 'Lainnya' },
    { value: '11', label: 'Fotografi' }, { value: '12', label: 'Fitness' }, { value: '13', label: 'Belanja' },
    { value: '14', label: 'Menggambar' }, { value: '15', label: 'Bermain Musik' }, { value: '16', label: 'mendaki' },
    { value: '17', label: 'Jogging' }, { value: '18', label: 'Bermain Gitar' }, { value: '19', label: 'Bermain Bola' },
    { value: '20', label: 'Bermain Bulu Tangkis' }, { value: '21', label: 'Bermain Bola Tenis' }, { value: '22', label: 'Bermain Biola' },
    { value: '23', label: 'Bermain Piano' }, { value: '24', label: 'Berlari' }, { value: '25', label: 'Berkemah' },
    { value: '26', label: 'Memancing' }, { value: '27', label: 'Berselancar' }, { value: '28', label: 'Bermain Gitar' },
    { value: '29', label: 'Bermain Boneka' }, { value: '30', label: 'Makan' }, { value: '31', label: 'Menjahit' },
    { value: '32', label: 'Main Puzzle' }, { value: '33', label: 'Mewarnai' }
  ];

  const citaMapping = [
    { value: '1', label: 'PNS' }, { value: '2', label: 'TNI/Polri' }, { value: '3', label: 'Guru/Dosen' },
    { value: '4', label: 'Dokter' }, { value: '5', label: 'Politikus' }, { value: '6', label: 'Wiraswasta' },
    { value: '7', label: 'Seni/Lukis/Artis/Sejenis' }, { value: '8', label: 'Lainnya' }, { value: '11', label: 'Penghafal Al-Qur\'an' },
    { value: '12', label: 'Atlet E-Sport Profesional' }, { value: '13', label: 'Atlet' }, { value: '14', label: 'Content Creator' },
    { value: '15', label: 'Vloger' }, { value: '16', label: 'Koki' }, { value: '17', label: 'Pendeta' },
    { value: '18', label: 'Perawat' }, { value: '19', label: 'Pilot' }, { value: '20', label: 'Pembalap' },
    { value: '21', label: 'Atlit Olahraga' }, { value: '22', label: 'Pengacara' }, { value: '23', label: 'Da\'i / Ustadz' },
    { value: '24', label: 'Entertainer / Pekerja Seni' }, { value: '25', label: 'Wartawan' }, { value: '26', label: 'Pengusaha / Bisnismen' },
    { value: '27', label: 'Penulis' }, { value: '28', label: 'Penyiar Radio' }, { value: '29', label: 'Pembawa Acara / Master Ceremony' },
    { value: '30', label: 'Polisi' }, { value: '31', label: 'Pemadam Kebakaran' }, { value: '32', label: 'Astronot' },
    { value: '33', label: 'Masinis Kereta Api' }, { value: '34', label: 'Perawat / Suster' }, { value: '35', label: 'Bidan' },
    { value: '36', label: 'Presiden' }, { value: '37', label: 'Pegawai Negeri Sipil / PNS' }, { value: '38', label: 'Translator' },
    { value: '39', label: 'Designer' }, { value: '40', label: 'Pelaut' }, { value: '41', label: 'Arsitek' }
  ];

  const getLabel = (value: string, mapping: { value: string, label: string }[] | Record<string, string>) => {
    if (!value) return '-';
    if (Array.isArray(mapping)) {
      const found = mapping.find(m => m.value === value.toString());
      return found ? found.label : value;
    } else {
      return mapping[value.toString()] || value;
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    const element = document.getElementById('pdf-content-to-capture');
    if (!element) {
      setIsGeneratingPDF(false);
      return;
    }

    try {
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove all stylesheets to avoid oklch parsing errors in html2canvas
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Data_Dapodik_${formData.nama.replace(/\s+/g, '_')}.pdf`);
      
      element.style.display = 'none';
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  const [notifications, setNotifications] = useState<any[]>([]);

  // Initial state with the requested fields
  const [formData, setFormData] = useState({
    nipd: '',
    nisn: '',
    nama: 'Siswa SMKN 1',
    tempat_lahir: '',
    tanggal_lahir: '',
    nik: '',
    agama: '',
    no_kk: '',
    reg_akta_lahir: '',
    jk: '',
    alamat_jalan: '',
    rt: '',
    rw: '',
    kel: '',
    kec: '',
    kab_kota: '',
    kode_pos: '',
    jenis_tinggal: '',
    alat_transportasi: '',
    no_hp: '',
    email: '',
    rombel: '',
    jurusan: '',
    // Data Orang Tua
    nama_ayah: '',
    nik_ayah: '',
    tahun_lahir_ayah: '',
    jenjang_pendidikan_ayah: '',
    pekerjaan_ayah: '',
    penghasilan_ayah: '',
    nama_ibu: '',
    nik_ibu: '',
    tahun_lahir_ibu: '',
    jenjang_pendidikan_ibu: '',
    pekerjaan_ibu: '',
    penghasilan_ibu: '',
    // Registrasi Peserta Didik
    sekolah_asal: '',
    id_hobby: '',
    id_cita: '',
    no_peserta_ujian: '',
    no_seri_ijazah: '',
    // Data Periodik
    tinggi_badan: '',
    berat_badan: '',
    lingkar_kepala: '',
    jumlah_saudara_kandung: '',
    anak_ke: '',
    jarak_rumah_ke_sekolah: '',
    sebutkan_kilometer: '',
    waktu_tempuh: '',
    // Data Kurang Mampu
    kurang_mampu: '',
    ket_kip: '',
    no_kip: '',
    nama_di_kip: '',
    kartu_lain: '',
    nama_dikartu: '',
    no_kartu: '',
    upload_kip: '',
    upload_kartu: '',
    // Verval Ijazah
    status_verval: '',
    data_salah: [] as string[],
    nama_verval: '',
    tempat_lahir_verval: '',
    tanggal_lahir_verval: '',
    upload_ijazah: '',
    upload_ijazah_preview: '',
    status_kk: '',
    data_salah_kk: [] as string[],
    nama_kk: '',
    tempat_lahir_kk: '',
    tanggal_lahir_kk: '',
    upload_kk: '',
    upload_kk_preview: '',
    akses_menu: 'all',
    terakhir_login: '',
    terakhir_update: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Restrict numeric fields
    if ([
      'nik', 'no_kk', 'no_hp', 'kode_pos', 'rt', 'rw', 'nik_ayah', 'nik_ibu', 
      'tahun_lahir_ayah', 'tahun_lahir_ibu', 'tinggi_badan', 'berat_badan', 
      'lingkar_kepala', 'jumlah_saudara_kandung', 'anak_ke', 'sebutkan_kilometer', 
      'waktu_tempuh'
    ].includes(name)) {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisnInput) return;
    
    setIsLoggingIn(true);
    setLoginError('');

    try {
      // Membersihkan input NISN dari spasi
      const cleanNisn = nisnInput.trim();
      
      // Pengecekan NISN asli ke Google Apps Script
      const response = await fetch(`${SCRIPT_URL}?action=login&nisn=${cleanNisn}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let result;
      
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Server returned non-JSON response:', text);
        setLoginError('Server mengembalikan format data yang salah (Bukan JSON). Pastikan fungsi doGet mengembalikan ContentService.MimeType.JSON.');
        return;
      }
      
      if (result && result.success) {
        if (result.data) {
          // Map data from server to formData structure
          // Ensure jk is 'L' or 'P' for dropdown matching
          const mappedData = { ...result.data };
          if (mappedData.jk === 'Laki-laki') mappedData.jk = 'L';
          if (mappedData.jk === 'Perempuan') mappedData.jk = 'P';
          
          // Convert data_salah from string to array
          if (mappedData.data_salah && typeof mappedData.data_salah === 'string') {
            mappedData.data_salah = mappedData.data_salah.split(', ').filter(Boolean);
          } else if (!mappedData.data_salah) {
            mappedData.data_salah = [];
          }
          
          setFormData(prev => ({
            ...prev,
            ...mappedData
          }));
          const allNotifications = result.data.notifications || [];
          setNotifications(allNotifications);
          
          // Use NISN from server as the consistent key for localStorage
          const serverNisn = mappedData.nisn || cleanNisn;
          const readIds = JSON.parse(localStorage.getItem(`read_notif_${serverNisn}`) || '[]');
          
          // Filter unread: must have an ID or Judul, and not be in readIds
          const unread = allNotifications.filter((n: any) => {
            const id = String(n.id || `${n.judul}-${n.pesan}` || '').trim();
            return id && !readIds.includes(id);
          });
          
          if (unread.length > 0) {
            setUnreadNotifications(unread);
            setShowBanner(true);
          }

          // Smart Redirect: Tentukan halaman pertama yang bisa diakses
          let initialSection: Section = 'dashboard';
          if (mappedData.akses_menu && mappedData.akses_menu !== 'all') {
            const allowed = mappedData.akses_menu.split(',').map((s: string) => s.trim().toLowerCase());
            if (!allowed.includes('dashboard')) {
              // Jika dashboard tidak ada, cari menu pertama yang ada di allMenuItems yang diizinkan
              const firstAllowed = allMenuItems.find(item => allowed.includes(item.id.toLowerCase()));
              if (firstAllowed) {
                initialSection = firstAllowed.id as Section;
              }
            }
          }
          setActiveSection(initialSection);
        }
        setIsLoggedIn(true);
      } else {
        setLoginError('NISN tidak terdaftar di database.');
      }
    } catch (error) {
      console.error('Login connection error:', error);
      setLoginError('Gagal terhubung ke server. Pastikan Apps Script di-deploy sebagai "Anyone" dan koneksi internet stabil.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNisnInput('');
    setActiveSection('dashboard');
    setShowBanner(false);
    setUnreadNotifications([]);
    setFormData({
      nipd: '',
      nisn: '',
      nama: 'Siswa SMKN 1',
      tempat_lahir: '',
      tanggal_lahir: '',
      nik: '',
      agama: '',
      no_kk: '',
      reg_akta_lahir: '',
      jk: '',
      alamat_jalan: '',
      rt: '',
      rw: '',
      kel: '',
      kec: '',
      kab_kota: '',
      kode_pos: '',
      jenis_tinggal: '',
      alat_transportasi: '',
      no_hp: '',
      email: '',
      rombel: '',
      jurusan: '',
      nama_ayah: '',
      nik_ayah: '',
      tahun_lahir_ayah: '',
      jenjang_pendidikan_ayah: '',
      pekerjaan_ayah: '',
      penghasilan_ayah: '',
      nama_ibu: '',
      nik_ibu: '',
      tahun_lahir_ibu: '',
      jenjang_pendidikan_ibu: '',
      pekerjaan_ibu: '',
      penghasilan_ibu: '',
      // Registrasi Peserta Didik
      sekolah_asal: '',
      id_hobby: '',
      id_cita: '',
      no_peserta_ujian: '',
      no_seri_ijazah: '',
      // Data Periodik
      tinggi_badan: '',
      berat_badan: '',
      lingkar_kepala: '',
      jumlah_saudara_kandung: '',
      anak_ke: '',
      jarak_rumah_ke_sekolah: '',
      sebutkan_kilometer: '',
      waktu_tempuh: '',
      // Data Kurang Mampu
      kurang_mampu: '',
      ket_kip: '',
      no_kip: '',
      nama_di_kip: '',
      kartu_lain: '',
      nama_dikartu: '',
      no_kartu: '',
      upload_kip: '',
      upload_kartu: '',
      // Verval Ijazah
      status_verval: '',
      data_salah: [],
      nama_verval: '',
      tempat_lahir_verval: '',
      tanggal_lahir_verval: ''
    });
  };

  const menuItems = allMenuItems.filter(item => {
    if (!formData.akses_menu || formData.akses_menu === 'all') return true;
    const allowed = formData.akses_menu.split(',').map((s: string) => s.trim().toLowerCase());
    return allowed.includes(item.id.toLowerCase());
  });

  // Redirect if current section is not allowed
  useEffect(() => {
    if (isLoggedIn && menuItems.length > 0) {
      const isAllowed = menuItems.some(item => item.id === activeSection);
      if (!isAllowed) {
        setActiveSection(menuItems[0].id as Section);
      }
    }
  }, [isLoggedIn, formData.akses_menu, activeSection, menuItems]);

  const markAllAsRead = () => {
    const serverNisn = formData.nisn;
    if (!serverNisn) return;
    
    const readIds = JSON.parse(localStorage.getItem(`read_notif_${serverNisn}`) || '[]');
    const currentUnreadIds = unreadNotifications
      .map(n => String(n.id || `${n.judul}-${n.pesan}` || '').trim())
      .filter(Boolean);
      
    const newReadIds = [...new Set([...readIds, ...currentUnreadIds])];
    localStorage.setItem(`read_notif_${serverNisn}`, JSON.stringify(newReadIds));
    setShowBanner(false);
    setUnreadNotifications([]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-6 sm:p-10 rounded-[2.5rem] border border-white/10 relative z-10"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <GraduationCap className="text-white w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white">Biodata Siswa</h1>
              <p className="text-slate-400">SMKN 1 Palopo • Sistem Informasi Dapodik</p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-6 pt-4">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nomor Induk Siswa Nasional</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={nisnInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Hanya angka
                      if (val.length <= 10) setNisnInput(val);
                    }}
                    placeholder="Contoh: 0056781234" 
                    maxLength={10}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg tracking-widest font-mono"
                  />
                </div>
                {loginError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 ml-1 flex items-center gap-2"
                  >
                    <AlertCircle size={14} />
                    {loginError}
                  </motion.p>
                )}
                <p className="text-[10px] text-slate-500 mt-2 ml-1 uppercase tracking-widest font-bold">
                  {nisnInput.length}/10 Karakter
                </p>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn || nisnInput.length !== 10}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoggingIn ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Masuk Sekarang
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-slate-500 pt-4">
              Masalah login? Hubungi Operator Dapodik Sekolah.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth <= 768 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : (window.innerWidth <= 768 ? 0 : 80),
          x: (window.innerWidth <= 768 && !isSidebarOpen) ? -280 : 0
        }}
        className={`glass border-r border-white/5 flex flex-col sticky top-0 h-screen z-50 overflow-hidden ${
          window.innerWidth <= 768 ? 'fixed inset-y-0 left-0 shadow-2xl' : ''
        }`}
      >
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
            >
              SMKN 1 Palopo
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as Section)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                activeSection === item.id 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
              {activeSection === item.id && isSidebarOpen && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && <span>Pengaturan</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 glass border-b border-white/5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block text-xs sm:text-sm font-medium text-slate-400">
              Portal Dapodik Siswa
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {(!formData.akses_menu || formData.akses_menu === 'all' || formData.akses_menu.toLowerCase().includes('cetak')) && (
              <button 
                onClick={() => setShowPDFPreview(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 border-none"
                title="Preview PDF Data Siswa"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl transition-all text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 border-none relative"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifikasi</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-[450px] bg-[#121212] border border-white/10 rounded-2xl p-4 sm:p-6 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Bell className="w-6 h-6 text-blue-400" />
                          </div>
                          <h4 className="font-bold text-lg">Notifikasi Umum</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full font-bold">
                            {notifications.length} Pesan
                          </span>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Tutup"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {notifications.length > 0 ? (
                          <>
                            {notifications.map((notif, idx) => {
                          const type = (notif.tipe || 'info').toLowerCase().trim();
                          const isWarning = type === 'warning';
                          const isError = type === 'error';
                          
                          return (
                            <div key={idx} className={`p-5 rounded-2xl border transition-all group ${
                              isWarning ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' :
                              isError ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40' :
                              'bg-white/5 border-white/10 hover:border-white/30'
                            }`}>
                              <div className="flex items-start gap-5">
                                <div className={`mt-2 w-3 h-3 rounded-full shrink-0 shadow-[0_0_12px] ${
                                  isWarning ? 'bg-amber-500 shadow-amber-500/50' : 
                                  isError ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50'
                                }`} />
                                <div className="space-y-2 flex-1">
                                  <p className={`text-base font-bold transition-colors ${
                                    isWarning ? 'text-amber-200 group-hover:text-amber-100' :
                                    isError ? 'text-red-200 group-hover:text-red-100' :
                                    'text-slate-100 group-hover:text-white'
                                  }`}>{notif.judul}</p>
                                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{notif.pesan}</p>
                                  <div className="flex items-center gap-3 pt-3">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <p className="text-xs text-slate-500 italic font-bold">{notif.tanggal}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                            })}
                            <button 
                              onClick={() => {
                                setActiveSection('notifikasi');
                                setShowNotifications(false);
                              }}
                              className="w-full py-4 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors border-t border-white/5 mt-2"
                            >
                              Lihat Semua Notifikasi
                            </button>
                          </>
                        ) : (
                          <div className="py-16 text-center">
                            <Bell className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-base text-slate-500 font-medium">Tidak ada pengumuman baru.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{formData.nama}</div>
                <div className="text-xs text-slate-500">{formData.nisn}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10 flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nama}`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <div className={`p-4 sm:p-8 max-w-5xl mx-auto w-full transition-all duration-500 ${(showNotifications || showBanner) ? 'blur-md opacity-50 pointer-events-none' : 'blur-0 opacity-100'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === 'dashboard' && (
                <DashboardView 
                  formData={formData} 
                />
              )}
              {activeSection === 'profil' && <ProfilEditView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
              {activeSection === 'orangtua' && <OrangTuaView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
              {activeSection === 'registrasi' && <RegistrasiView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
              {activeSection === 'periodik' && <PeriodikView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
              {activeSection === 'kurang_mampu' && <KurangMampuView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
              {activeSection === 'notifikasi' && <NotifikasiView notifications={notifications} />}
              {activeSection === 'verval' && <VervalView formData={formData} handleInputChange={handleInputChange} setFormData={setFormData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Notification Modal */}
      <AnimatePresence>
        {showBanner && unreadNotifications.length > 0 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={markAllAsRead}
            />
            <motion.div
              key="notification-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 sm:p-10 relative">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 blur-[80px] -ml-24 -mb-24" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center border border-white/10 shadow-xl shadow-blue-500/10">
                      <Bell className="w-10 h-10 text-blue-400 animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Notifikasi Baru!
                      </h3>
                      <p className="text-slate-400 text-sm sm:text-base font-medium">
                        Anda memiliki {unreadNotifications.length} pesan penting yang belum dibaca.
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {unreadNotifications.map((notif, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400">
                          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {idx === 0 ? 'Pesan Terbaru' : `Pesan ${idx + 1}`}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-white line-clamp-1">
                            {notif.judul || 'Pemberitahuan Baru'}
                          </h4>
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                            {notif.pesan || notif.message || 'Silakan cek menu notifikasi untuk detail selengkapnya.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button 
                      onClick={markAllAsRead}
                      className="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold rounded-2xl transition-all border border-white/5 hover:border-white/10"
                    >
                      Tutup
                    </button>
                    <button 
                      onClick={() => {
                        markAllAsRead();
                        setActiveSection('notifikasi');
                      }}
                      className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group"
                    >
                      Lihat Detail
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPDFPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPDFPreview(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-full bg-[#121212] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between bg-white/5 gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">Preview Data</h3>
                    <p className="text-[10px] sm:text-sm text-slate-400">Tinjau data sebelum unduh</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isGeneratingPDF ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    Unduh PDF
                  </button>
                  <button 
                    onClick={() => setShowPDFPreview(false)}
                    className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable Preview */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50 flex justify-center">
                <div className="bg-white shadow-2xl origin-top transform scale-[0.6] sm:scale-[0.8] md:scale-100 mb-20">
                  <PDFTemplate formData={formData} getLabel={getLabel} religionMapping={religionMapping} stayMapping={stayMapping} transportMapping={transportMapping} eduMapping={eduMapping} jobMapping={jobMapping} incomeMapping={incomeMapping} hobbyMapping={hobbyMapping} citaMapping={citaMapping} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden PDF Content for Capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="pdf-content-to-capture">
          <PDFTemplate formData={formData} getLabel={getLabel} religionMapping={religionMapping} stayMapping={stayMapping} transportMapping={transportMapping} eduMapping={eduMapping} jobMapping={jobMapping} incomeMapping={incomeMapping} hobbyMapping={hobbyMapping} citaMapping={citaMapping} />
        </div>
      </div>
    </div>
  );
}

function PDFTemplate({ formData, getLabel, religionMapping, stayMapping, transportMapping, eduMapping, jobMapping, incomeMapping, hobbyMapping, citaMapping }: any) {
  return (
    <div style={{ width: '210mm', padding: '20mm', color: '#000', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#000', textTransform: 'uppercase' }}>DATA PESERTA DIDIK</h1>
        <p style={{ fontSize: '14px', margin: '5px 0', color: '#333' }}>Data Terkini Tahun Ajaran 2025/2026</p>
        <div style={{ borderBottom: '2px solid #000', marginTop: '10px' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Section A */}
        <div>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 15px', fontWeight: 'bold', fontSize: '13px', borderLeft: '4px solid #334155', marginBottom: '10px' }}>
            A. IDENTITAS PRIBADI
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginLeft: '15px' }}>
            <tbody>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Nama Lengkap</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.nama || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>NISN</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.nisn || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>NIPD</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.nipd || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>NIK</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.nik || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Jenis Kelamin</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Tempat, Tgl Lahir</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.tempat_lahir || '-'}, {formData.tanggal_lahir || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Agama</td><td style={{ padding: '6px 0', color: '#000' }}>: {getLabel(formData.agama, religionMapping)}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Rombel</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.rombel || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Jurusan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.jurusan || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>No. HP</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.no_hp || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Email</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.email || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section B */}
        <div>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 15px', fontWeight: 'bold', fontSize: '13px', borderLeft: '4px solid #334155', marginBottom: '10px' }}>
            B. ALAMAT & DOMISILI
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginLeft: '15px' }}>
            <tbody>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Alamat Jalan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.alamat_jalan || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>RT/RW</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.rt || '00'}/{formData.rw || '00'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Kelurahan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.kel || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Kecamatan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.kec || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Kabupaten/Kota</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.kab_kota || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Kode Pos</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.kode_pos || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Jenis Tinggal</td><td style={{ padding: '6px 0', color: '#000' }}>: {getLabel(formData.jenis_tinggal, stayMapping)}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Alat Transportasi</td><td style={{ padding: '6px 0', color: '#000' }}>: {getLabel(formData.alat_transportasi, transportMapping)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Section C */}
        <div>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 15px', fontWeight: 'bold', fontSize: '13px', borderLeft: '4px solid #334155', marginBottom: '10px' }}>
            C. DATA ORANG TUA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginLeft: '15px' }}>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', color: '#444', textDecoration: 'underline' }}>Ayah Kandung:</p>
              <table style={{ width: '100%', fontSize: '10px' }}>
                <tbody>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Nama</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.nama_ayah || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>NIK</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.nik_ayah || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Tahun Lahir</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.tahun_lahir_ayah || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Pendidikan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.jenjang_pendidikan_ayah, eduMapping)}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Pekerjaan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.pekerjaan_ayah, jobMapping)}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Penghasilan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.penghasilan_ayah, incomeMapping)}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px', color: '#444', textDecoration: 'underline' }}>Ibu Kandung:</p>
              <table style={{ width: '100%', fontSize: '10px' }}>
                <tbody>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Nama</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.nama_ibu || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>NIK</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.nik_ibu || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Tahun Lahir</td><td style={{ padding: '4px 0', color: '#000' }}>: {formData.tahun_lahir_ibu || '-'}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Pendidikan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.jenjang_pendidikan_ibu, eduMapping)}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Pekerjaan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.pekerjaan_ibu, jobMapping)}</td></tr>
                  <tr><td style={{ padding: '4px 0', fontWeight: 'bold', width: '45%', color: '#555' }}>Penghasilan</td><td style={{ padding: '4px 0', color: '#000' }}>: {getLabel(formData.penghasilan_ibu, incomeMapping)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section D */}
        <div>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 15px', fontWeight: 'bold', fontSize: '13px', borderLeft: '4px solid #334155', marginBottom: '10px' }}>
            D. DATA PERIODIK
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginLeft: '15px' }}>
            <table style={{ width: '100%', fontSize: '10px' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Tinggi Badan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.tinggi_badan || '-'} cm</td></tr>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Berat Badan</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.berat_badan || '-'} kg</td></tr>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Lingkar Kepala</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.lingkar_kepala || '-'} cm</td></tr>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Anak Ke</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.anak_ke || '-'}</td></tr>
              </tbody>
            </table>
            <table style={{ width: '100%', fontSize: '10px' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Jumlah Saudara</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.jumlah_saudara_kandung || '-'}</td></tr>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Jarak ke Sekolah</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.jarak_rumah_ke_sekolah === '1' ? 'Kurang dari 1 Km' : `Lebih dari 1 Km (${formData.sebutkan_kilometer} Km)`}</td></tr>
                <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Waktu Tempuh</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.waktu_tempuh || '-'} menit</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section E */}
        <div>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 15px', fontWeight: 'bold', fontSize: '13px', borderLeft: '4px solid #334155', marginBottom: '10px' }}>
            E. REGISTRASI PESERTA DIDIK
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginLeft: '15px' }}>
            <tbody>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Sekolah Asal</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.sekolah_asal || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Hobby</td><td style={{ padding: '6px 0', color: '#000' }}>: {getLabel(formData.id_hobby, hobbyMapping)}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>Cita-cita</td><td style={{ padding: '6px 0', color: '#000' }}>: {getLabel(formData.id_cita, citaMapping)}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>No. Peserta Ujian</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.no_peserta_ujian || '-'}</td></tr>
              <tr><td style={{ padding: '6px 0', fontWeight: 'bold', width: '40%', color: '#444' }}>No. Seri Ijazah</td><td style={{ padding: '6px 0', color: '#000' }}>: {formData.no_seri_ijazah || '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ 
  formData 
}: { 
  formData: any 
}) {
  const calculateStatus = (fields: string[]) => {
    if (fields.length === 0) return { status: 'Lengkap', color: 'emerald', percent: 100 };
    
    const filledFields = fields.filter(field => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
    const isComplete = filledFields.length === fields.length;
    return {
      status: isComplete ? 'Lengkap' : 'Belum Lengkap',
      color: isComplete ? 'emerald' : 'rose',
      percent: Math.round((filledFields.length / fields.length) * 100)
    };
  };

  const sections = [
    { 
      label: 'Profil Saya', 
      getRequiredFields: () => ['nama', 'jk', 'nipd', 'nisn', 'nik', 'agama', 'tempat_lahir', 'tanggal_lahir', 'no_kk', 'alamat_jalan', 'kel', 'kec', 'kab_kota', 'jenis_tinggal', 'alat_transportasi', 'no_hp', 'jurusan'] 
    },
    { 
      label: 'Data Orang Tua', 
      getRequiredFields: () => ['nama_ayah', 'nik_ayah', 'tahun_lahir_ayah', 'jenjang_pendidikan_ayah', 'pekerjaan_ayah', 'penghasilan_ayah', 'nama_ibu', 'nik_ibu', 'tahun_lahir_ibu', 'jenjang_pendidikan_ibu', 'pekerjaan_ibu', 'penghasilan_ibu'] 
    },
    { 
      label: 'Registrasi Peserta Didik', 
      getRequiredFields: () => ['sekolah_asal', 'id_hobby', 'id_cita', 'no_peserta_ujian', 'no_seri_ijazah'] 
    },
    { 
      label: 'Data Periodik', 
      getRequiredFields: () => {
        const fields = ['tinggi_badan', 'berat_badan', 'lingkar_kepala', 'jumlah_saudara_kandung', 'anak_ke', 'jarak_rumah_ke_sekolah', 'waktu_tempuh'];
        if (formData.jarak_rumah_ke_sekolah === '2') {
          fields.push('sebutkan_kilometer');
        }
        return fields;
      }
    },
    { 
      label: 'Siswa Kurang Mampu', 
      getRequiredFields: () => {
        const fields = ['kurang_mampu'];
        if (formData.kurang_mampu === 'Ya') {
          fields.push('ket_kip');
          if (formData.ket_kip === 'Ya') {
            fields.push('no_kip', 'nama_di_kip', 'upload_kip');
          }
          if (['PKH', 'KKS', 'SKTM'].includes(formData.kartu_lain)) {
            fields.push('nama_dikartu', 'no_kartu', 'upload_kartu');
          }
        }
        return fields;
      }
    },
    { 
      label: 'Verval Ijazah', 
      getRequiredFields: () => {
        const fields = ['status_verval'];
        if (formData.status_verval === 'Tidak') {
          fields.push('data_salah');
          if (Array.isArray(formData.data_salah)) {
            if (formData.data_salah.includes('nama')) fields.push('nama_verval');
            if (formData.data_salah.includes('tempat lahir')) fields.push('tempat_lahir_verval');
            if (formData.data_salah.includes('tanggal lahir')) fields.push('tanggal_lahir_verval');
          }
        }
        return fields;
      }
    },
  ];

  const overallCompletion = Math.round(
    sections.reduce((acc, section) => acc + calculateStatus(section.getRequiredFields()).percent, 0) / sections.length
  );

  const stats = [
    { label: 'Kelengkapan Data', value: `${overallCompletion}%`, trend: overallCompletion === 100 ? 'Sempurna' : 'Butuh Update', color: overallCompletion === 100 ? 'emerald' : 'blue' },
    { label: 'NIPD', value: formData.nipd || '-', trend: '-', color: 'emerald' },
    { label: 'NISN', value: formData.nisn || '-', trend: '-', color: 'purple' },
    { label: 'Rombel', value: formData.rombel || '-', trend: '-', color: 'rose' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Halo, {formData.nama}!</h1>
        <p className="text-xs sm:text-sm text-slate-400">Selamat datang di portal mandiri Dapodik SMKN 1 Palopo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card p-4 sm:p-6"
          >
            <div className="text-sm text-slate-500 font-medium mb-2">{stat.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                stat.color === 'rose' ? 'bg-rose-500/10 text-rose-400' : 
                stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Status Kelengkapan Data (Field Wajib)</h3>
            <span className="text-xs text-blue-400 font-semibold italic">Dihitung otomatis berdasarkan keterisian data</span>
          </div>
          <div className="space-y-4">
            {sections.map((section, i) => {
              const requiredFields = section.getRequiredFields();
              const { status, color, percent } = calculateStatus(requiredFields);
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                        color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{section.label}</span>
                        <span className="text-[10px] text-slate-500">{requiredFields.length} Field Wajib</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                      <span className={`text-xs font-bold min-w-[80px] text-right ${
                        color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {status} ({percent}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilEditView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSave = async () => {
    // List field yang wajib diisi
    const requiredFields = [
      { key: 'nama', label: 'Nama Lengkap' },
      { key: 'jk', label: 'Jenis Kelamin' },
      { key: 'nipd', label: 'NIPD' },
      { key: 'nisn', label: 'NISN' },
      { key: 'nik', label: 'NIK' },
      { key: 'agama', label: 'Agama' },
      { key: 'tempat_lahir', label: 'Tempat Lahir' },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
      { key: 'no_kk', label: 'No. Kartu Keluarga' },
      { key: 'alamat_jalan', label: 'Alamat Jalan' },
      { key: 'kel', label: 'Kelurahan' },
      { key: 'kec', label: 'Kecamatan' },
      { key: 'kab_kota', label: 'Kabupaten/Kota' },
      { key: 'jenis_tinggal', label: 'Jenis Tinggal' },
      { key: 'alat_transportasi', label: 'Alat Transportasi' },
      { key: 'no_hp', label: 'No. HP' },
      { key: 'jurusan', label: 'Jurusan' }
    ];

    // Cek field kosong
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        setErrorMessage(`Gagal menyimpan: Field "${field.label}" wajib diisi.`);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    // Validasi NIK harus 16 karakter
    if (formData.nik && formData.nik.toString().length !== 16) {
      setErrorMessage('Gagal menyimpan: NIK harus berjumlah tepat 16 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    // Validasi No. KK harus 16 karakter
    if (formData.no_kk && formData.no_kk.toString().length !== 16) {
      setErrorMessage('Gagal menyimpan: No. Kartu Keluarga harus berjumlah tepat 16 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setIsSaving(true);
    
    try {
      // Menyiapkan data lengkap sesuai urutan kolom di Google Sheet
      // Mengirimkan seluruh data (Siswa + Orang Tua) agar tidak ada data yang terhapus
      const payload = {
        action: 'update_profile',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        tempat_lahir: String(formData.tempat_lahir || ''),
        tanggal_lahir: String(formData.tanggal_lahir || ''),
        nik: String(formData.nik || ''),
        agama: String(formData.agama || ''),
        no_kk: String(formData.no_kk || ''),
        reg_akta_lahir: String(formData.reg_akta_lahir || ''),
        jk: String(formData.jk || ''),
        alamat_jalan: String(formData.alamat_jalan || ''),
        rt: String(formData.rt || ''),
        rw: String(formData.rw || ''),
        kel: String(formData.kel || ''),
        kec: String(formData.kec || ''),
        kab_kota: String(formData.kab_kota || ''),
        kode_pos: String(formData.kode_pos || ''),
        jenis_tinggal: String(formData.jenis_tinggal || ''),
        alat_transportasi: String(formData.alat_transportasi || ''),
        no_hp: String(formData.no_hp || ''),
        email: String(formData.email || ''),
        rombel: String(formData.rombel || ''),
        jurusan: String(formData.jurusan || ''),
        // Data Orang Tua (Kolom X - AI)
        nama_ayah: String(formData.nama_ayah || ''),
        nik_ayah: String(formData.nik_ayah || ''),
        tahun_lahir_ayah: String(formData.tahun_lahir_ayah || ''),
        jenjang_pendidikan_ayah: String(formData.jenjang_pendidikan_ayah || ''),
        pekerjaan_ayah: String(formData.pekerjaan_ayah || ''),
        penghasilan_ayah: String(formData.penghasilan_ayah || ''),
        nama_ibu: String(formData.nama_ibu || ''),
        nik_ibu: String(formData.nik_ibu || ''),
        tahun_lahir_ibu: String(formData.tahun_lahir_ibu || ''),
        jenjang_pendidikan_ibu: String(formData.jenjang_pendidikan_ibu || ''),
        pekerjaan_ibu: String(formData.pekerjaan_ibu || ''),
        penghasilan_ibu: String(formData.penghasilan_ibu || ''),
        sekolah_asal: String(formData.sekolah_asal || ''),
        id_hobby: String(formData.id_hobby || ''),
        id_cita: String(formData.id_cita || ''),
        no_peserta_ujian: String(formData.no_peserta_ujian || ''),
        no_seri_ijazah: String(formData.no_seri_ijazah || ''),
        tinggi_badan: String(formData.tinggi_badan || ''),
        berat_badan: String(formData.berat_badan || ''),
        lingkar_kepala: String(formData.lingkar_kepala || ''),
        jumlah_saudara_kandung: String(formData.jumlah_saudara_kandung || ''),
        anak_ke: String(formData.anak_ke || ''),
        jarak_rumah_ke_sekolah: String(formData.jarak_rumah_ke_sekolah || ''),
        "Sebutkan_(Berapa_Kilometer)": String(formData.sebutkan_kilometer || ''),
        "waktu_tempuh_ke_sekolah_(menit)": String(formData.waktu_tempuh || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        jenis_kartu: String(formData.jenis_kartu || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        status_verval: String(formData.status_verval || ''),
        data_salah: Array.isArray(formData.data_salah) ? formData.data_salah.join(', ') : '',
        nama_verval: String(formData.nama_verval || ''),
        tempat_lahir_verval: String(formData.tempat_lahir_verval || ''),
        tanggal_lahir_verval: String(formData.tanggal_lahir_verval || '')
      };

      console.log('Sending full profile data to Google Sheet...');
      
      // Menggunakan URLSearchParams untuk mengirim data sebagai form-urlencoded
      // Ini lebih kompatibel dengan Google Apps Script (e.parameter)
      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Pastikan koneksi internet stabil.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Profil Siswa</h1>
          <p className="text-xs sm:text-sm text-slate-400">Lengkapi data pribadi sesuai dengan dokumen resmi untuk sinkronisasi Dapodik.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Perubahan
        </button>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data berhasil diperbarui." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto pb-20">
        <div className="space-y-6">
          {/* Identitas Pokok */}
          <div className="glass-card p-4 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" /> Identitas Pokok
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap <span className="text-red-500">*</span></label>
                <input name="nama" value={formData.nama} readOnly type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis Kelamin <span className="text-red-500">*</span></label>
                <select name="jk" value={formData.jk} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIPD <span className="text-red-500">*</span></label>
                <input name="nipd" value={formData.nipd} readOnly type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN <span className="text-red-500">*</span></label>
                <input name="nisn" value={formData.nisn} readOnly type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIK (Sesuai KK) <span className="text-red-500">*</span></label>
                <input 
                  name="nik" 
                  value={formData.nik} 
                  onChange={handleInputChange} 
                  type="text" 
                  maxLength={16}
                  placeholder="16 digit NIK"
                  className={`w-full bg-white/5 border ${formData.nik && formData.nik.toString().length !== 16 ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all`} 
                />
                {formData.nik && formData.nik.toString().length !== 16 && (
                  <p className="text-[10px] text-red-400">NIK harus 16 digit (Saat ini: {formData.nik.toString().length})</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agama <span className="text-red-500">*</span></label>
                <select 
                  name="agama" 
                  value={formData.agama} 
                  onChange={handleInputChange} 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="">Pilih Agama</option>
                  <option value="1">Islam</option>
                  <option value="2">Kristen</option>
                  <option value="3">Katholik</option>
                  <option value="4">Hindu</option>
                  <option value="5">Budha</option>
                  <option value="6">Khonghucu</option>
                  <option value="7">Kepercayaan kpd Tuhan YME</option>
                  <option value="99">lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kelahiran & Dokumen */}
          <div className="glass-card p-4 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-purple-400" /> Kelahiran & Dokumen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempat Lahir <span className="text-red-500">*</span></label>
                <input name="tempat_lahir" value={formData.tempat_lahir} readOnly type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Lahir <span className="text-red-500">*</span></label>
                <input name="tanggal_lahir" value={formData.tanggal_lahir} readOnly type="date" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Kartu Keluarga <span className="text-red-500">*</span></label>
                <input 
                  name="no_kk" 
                  value={formData.no_kk} 
                  onChange={handleInputChange} 
                  type="text" 
                  maxLength={16}
                  placeholder="16 digit No. KK"
                  className={`w-full bg-white/5 border ${formData.no_kk && formData.no_kk.toString().length !== 16 ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all`} 
                />
                {formData.no_kk && formData.no_kk.toString().length !== 16 && (
                  <p className="text-[10px] text-red-400">No. KK harus 16 digit (Saat ini: {formData.no_kk.toString().length})</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Registrasi Akta Lahir</label>
                <input name="reg_akta_lahir" value={formData.reg_akta_lahir} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
            </div>
          </div>

          {/* Alamat & Domisili */}
          <div className="glass-card p-4 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" /> Alamat & Domisili
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-3 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alamat Jalan <span className="text-red-500">*</span></label>
                <input name="alamat_jalan" value={formData.alamat_jalan} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RT</label>
                <input name="rt" value={formData.rt} onChange={handleInputChange} type="text" placeholder="000" maxLength={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RW</label>
                <input name="rw" value={formData.rw} onChange={handleInputChange} type="text" placeholder="000" maxLength={3} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode Pos</label>
                <input name="kode_pos" value={formData.kode_pos} onChange={handleInputChange} type="text" placeholder="00000" maxLength={5} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelurahan <span className="text-red-500">*</span></label>
                <input name="kel" value={formData.kel} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kecamatan <span className="text-red-500">*</span></label>
                <input name="kec" value={formData.kec} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kabupaten/Kota <span className="text-red-500">*</span></label>
                <input name="kab_kota" value={formData.kab_kota} onChange={handleInputChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
            </div>
          </div>

          {/* Lainnya */}
          <div className="glass-card p-4 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" /> Informasi Tambahan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenis Tinggal <span className="text-red-500">*</span></label>
                <select 
                  name="jenis_tinggal" 
                  value={formData.jenis_tinggal} 
                  onChange={handleInputChange} 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="">Pilih Jenis Tinggal</option>
                  <option value="1">Bersama orang tua</option>
                  <option value="2">Wali</option>
                  <option value="3">Kost</option>
                  <option value="4">Asrama</option>
                  <option value="5">Panti asuhan</option>
                  <option value="10">Pesantren</option>
                  <option value="99">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alat Transportasi <span className="text-red-500">*</span></label>
                <select 
                  name="alat_transportasi" 
                  value={formData.alat_transportasi} 
                  onChange={handleInputChange} 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="">Pilih Alat Transportasi</option>
                  <option value="1">Jalan kaki</option>
                  <option value="3">Angkutan umum/bus/pete-pete</option>
                  <option value="4">Mobil/bus antar jemput</option>
                  <option value="6">Ojek</option>
                  <option value="7">Andong/bendi/sado/dokar/delman/becak</option>
                  <option value="8">Perahu penyeberangan/rakit/getek</option>
                  <option value="12">Sepeda</option>
                  <option value="13">Sepeda motor</option>
                  <option value="14">Mobil pribadi</option>
                  <option value="99">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. HP <span className="text-red-500">*</span></label>
                <input 
                  name="no_hp" 
                  value={formData.no_hp} 
                  onChange={handleInputChange} 
                  type="text" 
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                <input name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rombel</label>
                <select 
                  name="rombel" 
                  value={formData.rombel} 
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none cursor-not-allowed opacity-60 transition-all"
                >
                  <option value="">Pilih Rombel</option>
                  {[
                    "10 AKL 1", "10 AKL 2", "10 AKL 3", "10 Kuliner 1", "10 Kuliner 2", "10 MPLB 1", "10 MPLB 2", "10 MPLB 3", "10 PMS 1", "10 PMS 2", "10 PMS 3", "10 TJKT 1", "10 TJKT 2", "10 TJKT 3", "10 ULP",
                    "11 AKL 1", "11 AKL 2", "11 AKL 3", "11 AKL 4", "11 Kuliner 1", "11 Kuliner 2", "11 MPLB 1", "11 MPLB 2", "11 MPLB 3", "11 MPLB 4", "11 PMS 1", "11 PMS 2", "11 PMS 3", "11 TJKT 1", "11 TJKT 2", "11 TJKT 3", "11 TJKT 4", "11 ULP",
                    "12 AKL 1", "12 AKL 2", "12 AKL 3", "12 Kuliner 1", "12 Kuliner 2", "12 MPLB 1", "12 MPLB 2", "12 MPLB 3", "12 PMS 1", "12 PMS 2", "12 TJKT 1", "12 TJKT 2", "12 TJKT 3", "12 ULP"
                  ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurusan <span className="text-red-500">*</span></label>
                <select 
                  name="jurusan" 
                  value={formData.jurusan} 
                  onChange={handleInputChange} 
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="">Pilih Jurusan</option>
                  {[
                    "Akuntansi dan Keuangan Lembaga",
                    "Kuliner",
                    "Manajemen Perkantoran dan Layanan Bisnis",
                    "Pemasaran",
                    "Teknik Jaringan Komputer dan Telekomunikasi",
                    "Usaha Layanan Wisata"
                  ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrangTuaView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Wrapper for handleInputChange to handle automatic income logic
  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Call original handler first
    handleInputChange(e);

    // Automatic income logic
    if (name === 'pekerjaan_ayah') {
      if (value === '1' || value === '98') {
        setFormData((prev: any) => ({ ...prev, penghasilan_ayah: '99' }));
      }
    } else if (name === 'pekerjaan_ibu') {
      if (value === '1' || value === '98') {
        setFormData((prev: any) => ({ ...prev, penghasilan_ibu: '99' }));
      }
    }
  };

  const jenjangPendidikan = [
    { value: '0', label: 'Tidak sekolah' },
    { value: '1', label: 'PAUD' },
    { value: '2', label: 'TK / sederajat' },
    { value: '3', label: 'Putus SD' },
    { value: '4', label: 'SD / sederajat' },
    { value: '5', label: 'SMP / sederajat' },
    { value: '6', label: 'SMA / sederajat' },
    { value: '7', label: 'Paket A' },
    { value: '8', label: 'Paket B' },
    { value: '9', label: 'Paket C' },
    { value: '20', label: 'D1' },
    { value: '21', label: 'D2' },
    { value: '22', label: 'D3' },
    { value: '23', label: 'D4' },
    { value: '30', label: 'S1' },
    { value: '31', label: 'Profesi' },
    { value: '32', label: 'Sp-1' },
    { value: '35', label: 'S2' },
    { value: '36', label: 'S2 Terapan' },
    { value: '37', label: 'Sp-2' },
    { value: '40', label: 'S3' },
    { value: '41', label: 'S3 Terapan' },
    { value: '90', label: 'Non formal' },
    { value: '91', label: 'Informal' },
    { value: '99', label: 'Lainnya' },
  ];

  const pekerjaan = [
    { value: '1', label: 'Tidak bekerja' },
    { value: '2', label: 'Nelayan' },
    { value: '3', label: 'Petani' },
    { value: '4', label: 'Peternak' },
    { value: '5', label: 'PNS/TNI/Polri' },
    { value: '6', label: 'Karyawan Swasta' },
    { value: '7', label: 'Pedagang Kecil' },
    { value: '8', label: 'Pedagang Besar' },
    { value: '9', label: 'Wiraswasta' },
    { value: '10', label: 'Wirausaha' },
    { value: '11', label: 'Buruh' },
    { value: '12', label: 'Pensiunan' },
    { value: '13', label: 'Tenaga Kerja Indonesia' },
    { value: '14', label: 'Karyawan BUMN' },
    { value: '90', label: 'Tidak dapat diterapkan' },
    { value: '98', label: 'Sudah Meninggal' },
    { value: '99', label: 'Lainnya' },
  ];

  const penghasilan = [
    { value: '11', label: 'Kurang dari Rp. 500,000' },
    { value: '12', label: 'Rp. 500,000 - Rp. 999,999' },
    { value: '13', label: 'Rp. 1,000,000 - Rp. 1,999,999' },
    { value: '14', label: 'Rp. 2,000,000 - Rp. 4,999,999' },
    { value: '15', label: 'Rp. 5,000,000 - Rp. 20,000,000' },
    { value: '16', label: 'Lebih dari Rp. 20,000,000' },
    { value: '99', label: 'Tidak Berpenghasilan' },
  ];

  const handleSave = async () => {
    // List of mandatory fields
    const requiredAyah = ['nama_ayah', 'tahun_lahir_ayah', 'jenjang_pendidikan_ayah', 'pekerjaan_ayah', 'penghasilan_ayah'];
    const requiredIbu = ['nama_ibu', 'tahun_lahir_ibu', 'jenjang_pendidikan_ibu', 'pekerjaan_ibu', 'penghasilan_ibu'];

    // Check Ayah mandatory fields
    for (const field of requiredAyah) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        const label = field.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        setErrorMessage(`Gagal menyimpan: Field "${label}" wajib diisi.`);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    // Check Ibu mandatory fields
    for (const field of requiredIbu) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        const label = field.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        setErrorMessage(`Gagal menyimpan: Field "${label}" wajib diisi.`);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    // Conditional NIK validation: Mandatory unless Pekerjaan is "Sudah Meninggal" (98)
    if (formData.pekerjaan_ayah !== '98') {
      if (!formData.nik_ayah || formData.nik_ayah.toString().trim() === '') {
        setErrorMessage('Gagal menyimpan: NIK Ayah wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    if (formData.pekerjaan_ibu !== '98') {
      if (!formData.nik_ibu || formData.nik_ibu.toString().trim() === '') {
        setErrorMessage('Gagal menyimpan: NIK Ibu wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    // Validasi NIK Ayah/Ibu harus 16 karakter jika diisi
    if (formData.nik_ayah && formData.nik_ayah.toString().length !== 16) {
      setErrorMessage('Gagal menyimpan: NIK Ayah harus berjumlah tepat 16 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }
    if (formData.nik_ibu && formData.nik_ibu.toString().length !== 16) {
      setErrorMessage('Gagal menyimpan: NIK Ibu harus berjumlah tepat 16 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    // Validasi Tahun Lahir Ayah/Ibu harus 4 karakter jika diisi
    if (formData.tahun_lahir_ayah && formData.tahun_lahir_ayah.toString().length !== 4) {
      setErrorMessage('Gagal menyimpan: Tahun Lahir Ayah harus berjumlah tepat 4 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }
    if (formData.tahun_lahir_ibu && formData.tahun_lahir_ibu.toString().length !== 4) {
      setErrorMessage('Gagal menyimpan: Tahun Lahir Ibu harus berjumlah tepat 4 karakter.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setIsSaving(true);
    
    try {
      // Menyiapkan data lengkap sesuai urutan kolom di Google Sheet
      // Mengirimkan seluruh data (Siswa + Orang Tua) agar tidak ada data yang terhapus
      // Menggunakan action 'update_profile' agar sama dengan logika di menu profil yang sudah berhasil
      const payload = {
        action: 'update_profile',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        tempat_lahir: String(formData.tempat_lahir || ''),
        tanggal_lahir: String(formData.tanggal_lahir || ''),
        nik: String(formData.nik || ''),
        agama: String(formData.agama || ''),
        no_kk: String(formData.no_kk || ''),
        reg_akta_lahir: String(formData.reg_akta_lahir || ''),
        jk: String(formData.jk || ''),
        alamat_jalan: String(formData.alamat_jalan || ''),
        rt: String(formData.rt || ''),
        rw: String(formData.rw || ''),
        kel: String(formData.kel || ''),
        kec: String(formData.kec || ''),
        kab_kota: String(formData.kab_kota || ''),
        kode_pos: String(formData.kode_pos || ''),
        jenis_tinggal: String(formData.jenis_tinggal || ''),
        alat_transportasi: String(formData.alat_transportasi || ''),
        no_hp: String(formData.no_hp || ''),
        email: String(formData.email || ''),
        rombel: String(formData.rombel || ''),
        jurusan: String(formData.jurusan || ''),
        // Data Orang Tua (Kolom X - AI)
        nama_ayah: String(formData.nama_ayah || ''),
        nik_ayah: String(formData.nik_ayah || ''),
        tahun_lahir_ayah: String(formData.tahun_lahir_ayah || ''),
        jenjang_pendidikan_ayah: String(formData.jenjang_pendidikan_ayah || ''),
        pekerjaan_ayah: String(formData.pekerjaan_ayah || ''),
        penghasilan_ayah: String(formData.penghasilan_ayah || ''),
        nama_ibu: String(formData.nama_ibu || ''),
        nik_ibu: String(formData.nik_ibu || ''),
        tahun_lahir_ibu: String(formData.tahun_lahir_ibu || ''),
        jenjang_pendidikan_ibu: String(formData.jenjang_pendidikan_ibu || ''),
        pekerjaan_ibu: String(formData.pekerjaan_ibu || ''),
        penghasilan_ibu: String(formData.penghasilan_ibu || ''),
        sekolah_asal: String(formData.sekolah_asal || ''),
        id_hobby: String(formData.id_hobby || ''),
        id_cita: String(formData.id_cita || ''),
        no_peserta_ujian: String(formData.no_peserta_ujian || ''),
        no_seri_ijazah: String(formData.no_seri_ijazah || ''),
        tinggi_badan: String(formData.tinggi_badan || ''),
        berat_badan: String(formData.berat_badan || ''),
        lingkar_kepala: String(formData.lingkar_kepala || ''),
        jumlah_saudara_kandung: String(formData.jumlah_saudara_kandung || ''),
        anak_ke: String(formData.anak_ke || ''),
        jarak_rumah_ke_sekolah: String(formData.jarak_rumah_ke_sekolah || ''),
        "Sebutkan_(Berapa_Kilometer)": String(formData.sebutkan_kilometer || ''),
        "waktu_tempuh_ke_sekolah_(menit)": String(formData.waktu_tempuh || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        jenis_kartu: String(formData.jenis_kartu || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        status_verval: String(formData.status_verval || ''),
        data_salah: Array.isArray(formData.data_salah) ? formData.data_salah.join(', ') : '',
        nama_verval: String(formData.nama_verval || ''),
        tempat_lahir_verval: String(formData.tempat_lahir_verval || ''),
        tanggal_lahir_verval: String(formData.tanggal_lahir_verval || '')
      };

      console.log('Sending full parent & student data with action update_profile...');

      // Menggunakan URLSearchParams untuk mengirim data sebagai form-urlencoded
      // Ini lebih kompatibel dengan Google Apps Script (e.parameter)
      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Periksa koneksi internet Anda.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Data Orang Tua</h1>
        <p className="text-xs sm:text-sm text-slate-400">Lengkapi informasi ayah dan ibu kandung sesuai dengan dokumen resmi.</p>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data orang tua berhasil diperbarui." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Data Ayah */}
        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> Data Ayah Kandung
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Ayah Kandung <span className="text-red-500">*</span></label>
              <input name="nama_ayah" value={formData.nama_ayah} onChange={onFieldChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                NIK Ayah {formData.pekerjaan_ayah !== '98' && <span className="text-red-500">*</span>}
              </label>
              <input 
                name="nik_ayah" 
                value={formData.nik_ayah} 
                onChange={onFieldChange} 
                type="text" 
                maxLength={16}
                placeholder={formData.pekerjaan_ayah === '98' ? "Opsional (Alm)" : "16 digit NIK"}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Lahir Ayah <span className="text-red-500">*</span></label>
              <input 
                name="tahun_lahir_ayah" 
                value={formData.tahun_lahir_ayah} 
                onChange={onFieldChange} 
                type="text" 
                maxLength={4}
                placeholder="Contoh: 1980"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendidikan Terakhir <span className="text-red-500">*</span></label>
              <select name="jenjang_pendidikan_ayah" value={formData.jenjang_pendidikan_ayah} onChange={onFieldChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Pendidikan</option>
                {jenjangPendidikan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pekerjaan <span className="text-red-500">*</span></label>
              <select name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={onFieldChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Pekerjaan</option>
                {pekerjaan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penghasilan Bulanan <span className="text-red-500">*</span></label>
              <select 
                name="penghasilan_ayah" 
                value={formData.penghasilan_ayah} 
                onChange={onFieldChange} 
                disabled={formData.pekerjaan_ayah === '1' || formData.pekerjaan_ayah === '98'}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
              >
                <option value="">Pilih Penghasilan</option>
                {penghasilan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data Ibu */}
        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> Data Ibu Kandung
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Ibu Kandung <span className="text-red-500">*</span></label>
              <input name="nama_ibu" value={formData.nama_ibu} onChange={onFieldChange} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                NIK Ibu {formData.pekerjaan_ibu !== '98' && <span className="text-red-500">*</span>}
              </label>
              <input 
                name="nik_ibu" 
                value={formData.nik_ibu} 
                onChange={onFieldChange} 
                type="text" 
                maxLength={16}
                placeholder={formData.pekerjaan_ibu === '98' ? "Opsional (Alm)" : "16 digit NIK"}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Lahir Ibu <span className="text-red-500">*</span></label>
              <input 
                name="tahun_lahir_ibu" 
                value={formData.tahun_lahir_ibu} 
                onChange={onFieldChange} 
                type="text" 
                maxLength={4}
                placeholder="Contoh: 1985"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendidikan Terakhir <span className="text-red-500">*</span></label>
              <select name="jenjang_pendidikan_ibu" value={formData.jenjang_pendidikan_ibu} onChange={onFieldChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Pendidikan</option>
                {jenjangPendidikan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pekerjaan <span className="text-red-500">*</span></label>
              <select name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={onFieldChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Pekerjaan</option>
                {pekerjaan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penghasilan Bulanan <span className="text-red-500">*</span></label>
              <select 
                name="penghasilan_ibu" 
                value={formData.penghasilan_ibu} 
                onChange={onFieldChange} 
                disabled={formData.pekerjaan_ibu === '1' || formData.pekerjaan_ibu === '98'}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-50"
              >
                <option value="">Pilih Penghasilan</option>
                {penghasilan.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Data Orang Tua
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrasiView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    // List field yang wajib diisi
    const requiredFields = [
      { key: 'sekolah_asal', label: 'Sekolah Asal' },
      { key: 'id_hobby', label: 'Hobby' },
      { key: 'id_cita', label: 'Cita-cita' }
    ];

    // Cek field kosong
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        setErrorMessage(`Gagal menyimpan: Field "${field.label}" wajib diisi.`);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    // Validasi Sekolah Asal (Harus SMP, bukan SMK/SMA)
    const sekolahAsal = (formData.sekolah_asal || '').toString().toLowerCase().trim();
    if (sekolahAsal.startsWith('smk') || sekolahAsal.startsWith('sma')) {
      setErrorMessage('Input Nama Sekolah SMP Anda');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setIsSaving(true);
    
    try {
      // Menyiapkan data lengkap sesuai urutan kolom di Google Sheet
      const payload = {
        action: 'update_profile',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        tempat_lahir: String(formData.tempat_lahir || ''),
        tanggal_lahir: String(formData.tanggal_lahir || ''),
        nik: String(formData.nik || ''),
        agama: String(formData.agama || ''),
        no_kk: String(formData.no_kk || ''),
        reg_akta_lahir: String(formData.reg_akta_lahir || ''),
        jk: String(formData.jk || ''),
        alamat_jalan: String(formData.alamat_jalan || ''),
        rt: String(formData.rt || ''),
        rw: String(formData.rw || ''),
        kel: String(formData.kel || ''),
        kec: String(formData.kec || ''),
        kab_kota: String(formData.kab_kota || ''),
        kode_pos: String(formData.kode_pos || ''),
        jenis_tinggal: String(formData.jenis_tinggal || ''),
        alat_transportasi: String(formData.alat_transportasi || ''),
        no_hp: String(formData.no_hp || ''),
        email: String(formData.email || ''),
        rombel: String(formData.rombel || ''),
        jurusan: String(formData.jurusan || ''),
        // Data Orang Tua (Kolom X - AI)
        nama_ayah: String(formData.nama_ayah || ''),
        nik_ayah: String(formData.nik_ayah || ''),
        tahun_lahir_ayah: String(formData.tahun_lahir_ayah || ''),
        jenjang_pendidikan_ayah: String(formData.jenjang_pendidikan_ayah || ''),
        pekerjaan_ayah: String(formData.pekerjaan_ayah || ''),
        penghasilan_ayah: String(formData.penghasilan_ayah || ''),
        nama_ibu: String(formData.nama_ibu || ''),
        nik_ibu: String(formData.nik_ibu || ''),
        tahun_lahir_ibu: String(formData.tahun_lahir_ibu || ''),
        jenjang_pendidikan_ibu: String(formData.jenjang_pendidikan_ibu || ''),
        pekerjaan_ibu: String(formData.pekerjaan_ibu || ''),
        penghasilan_ibu: String(formData.penghasilan_ibu || ''),
        // Registrasi Peserta Didik
        sekolah_asal: String(formData.sekolah_asal || ''),
        id_hobby: String(formData.id_hobby || ''),
        id_cita: String(formData.id_cita || ''),
        no_peserta_ujian: String(formData.no_peserta_ujian || ''),
        no_seri_ijazah: String(formData.no_seri_ijazah || ''),
        tinggi_badan: String(formData.tinggi_badan || ''),
        berat_badan: String(formData.berat_badan || ''),
        lingkar_kepala: String(formData.lingkar_kepala || ''),
        jumlah_saudara_kandung: String(formData.jumlah_saudara_kandung || ''),
        anak_ke: String(formData.anak_ke || ''),
        jarak_rumah_ke_sekolah: String(formData.jarak_rumah_ke_sekolah || ''),
        "Sebutkan_(Berapa_Kilometer)": String(formData.sebutkan_kilometer || ''),
        "waktu_tempuh_ke_sekolah_(menit)": String(formData.waktu_tempuh || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        jenis_kartu: String(formData.jenis_kartu || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        status_verval: String(formData.status_verval || ''),
        data_salah: Array.isArray(formData.data_salah) ? formData.data_salah.join(', ') : '',
        nama_verval: String(formData.nama_verval || ''),
        tempat_lahir_verval: String(formData.tempat_lahir_verval || ''),
        tanggal_lahir_verval: String(formData.tanggal_lahir_verval || '')
      };

      console.log('Sending full registration data to Google Sheet...');
      
      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key as keyof typeof payload]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Pastikan koneksi internet stabil.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  const hobbies = [
    { value: '1', label: 'Olah Raga' },
    { value: '2', label: 'Kesenian' },
    { value: '3', label: 'Membaca' },
    { value: '4', label: 'Menulis' },
    { value: '5', label: 'Traveling' },
    { value: '6', label: 'Lainnya' },
    { value: '11', label: 'Fotografi' },
    { value: '12', label: 'Fitness' },
    { value: '13', label: 'Belanja' },
    { value: '14', label: 'Menggambar' },
    { value: '15', label: 'Bermain Musik' },
    { value: '16', label: 'mendaki' },
    { value: '17', label: 'Jogging' },
    { value: '18', label: 'Bermain Gitar' },
    { value: '19', label: 'Bermain Bola' },
    { value: '20', label: 'Bermain Bulu Tangkis' },
    { value: '21', label: 'Bermain Bola Tenis' },
    { value: '22', label: 'Bermain Biola' },
    { value: '23', label: 'Bermain Piano' },
    { value: '24', label: 'Berlari' },
    { value: '25', label: 'Berkemah' },
    { value: '26', label: 'Memancing' },
    { value: '27', label: 'Berselancar' },
    { value: '28', label: 'Bermain Gitar' },
    { value: '29', label: 'Bermain Boneka' },
    { value: '30', label: 'Makan' },
    { value: '31', label: 'Menjahit' },
    { value: '32', label: 'Main Puzzle' },
    { value: '33', label: 'Mewarnai' },
  ];

  const citas = [
    { value: '1', label: 'PNS' },
    { value: '2', label: 'TNI/Polri' },
    { value: '3', label: 'Guru/Dosen' },
    { value: '4', label: 'Dokter' },
    { value: '5', label: 'Politikus' },
    { value: '6', label: 'Wiraswasta' },
    { value: '7', label: 'Seni/Lukis/Artis/Sejenis' },
    { value: '8', label: 'Lainnya' },
    { value: '11', label: 'Penghafal Al-Qur\'an' },
    { value: '12', label: 'Atlet E-Sport Profesional' },
    { value: '13', label: 'Atlet' },
    { value: '14', label: 'Content Creator' },
    { value: '15', label: 'Vloger' },
    { value: '16', label: 'Koki' },
    { value: '17', label: 'Pendeta' },
    { value: '18', label: 'Perawat' },
    { value: '19', label: 'Pilot' },
    { value: '20', label: 'Pembalap' },
    { value: '21', label: 'Atlit Olahraga' },
    { value: '22', label: 'Pengacara' },
    { value: '23', label: 'Da\'i / Ustadz' },
    { value: '24', label: 'Entertainer / Pekerja Seni' },
    { value: '25', label: 'Wartawan' },
    { value: '26', label: 'Pengusaha / Bisnismen' },
    { value: '27', label: 'Penulis' },
    { value: '28', label: 'Penyiar Radio' },
    { value: '29', label: 'Pembawa Acara / Master Ceremony' },
    { value: '30', label: 'Polisi' },
    { value: '31', label: 'Pemadam Kebakaran' },
    { value: '32', label: 'Astronot' },
    { value: '33', label: 'Masinis Kereta Api' },
    { value: '34', label: 'Perawat / Suster' },
    { value: '35', label: 'Bidan' },
    { value: '36', label: 'Presiden' },
    { value: '37', label: 'Pegawai Negeri Sipil / PNS' },
    { value: '38', label: 'Translator' },
    { value: '39', label: 'Designer' },
    { value: '40', label: 'Pelaut' },
    { value: '41', label: 'Arsitek' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Registrasi Peserta Didik</h1>
        <p className="text-xs sm:text-sm text-slate-400">Lengkapi data registrasi untuk keperluan administrasi sekolah.</p>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data registrasi berhasil diperbarui." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" /> Informasi Registrasi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sekolah Asal <span className="text-red-500">*</span></label>
              <input name="sekolah_asal" value={formData.sekolah_asal} onChange={handleInputChange} type="text" placeholder="Nama sekolah asal..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hobby <span className="text-red-500">*</span></label>
              <select name="id_hobby" value={formData.id_hobby} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Hobby</option>
                {hobbies.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cita-cita <span className="text-red-500">*</span></label>
              <select name="id_cita" value={formData.id_cita} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Cita-cita</option>
                {citas.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Peserta Ujian</label>
              <input name="no_peserta_ujian" value={formData.no_peserta_ujian} onChange={handleInputChange} type="text" placeholder="Nomor peserta ujian..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Seri Ijazah</label>
              <input name="no_seri_ijazah" value={formData.no_seri_ijazah} onChange={handleInputChange} type="text" placeholder="Nomor seri ijazah..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Data Registrasi
          </button>
        </div>
      </div>
    </div>
  );
}

function PeriodikView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear sebutkan_kilometer if jarak_rumah_ke_sekolah is '1'
  useEffect(() => {
    if (formData.jarak_rumah_ke_sekolah === '1' && formData.sebutkan_kilometer !== '') {
      setFormData((prev: any) => ({ ...prev, sebutkan_kilometer: '' }));
    }
  }, [formData.jarak_rumah_ke_sekolah, setFormData]);

  const handleSave = async () => {
    // List field yang wajib diisi
    const requiredFields = [
      { key: 'tinggi_badan', label: 'Tinggi Badan' },
      { key: 'berat_badan', label: 'Berat Badan' },
      { key: 'lingkar_kepala', label: 'Lingkar Kepala' },
      { key: 'jumlah_saudara_kandung', label: 'Jumlah Saudara Kandung' },
      { key: 'anak_ke', label: 'Anak Ke' },
      { key: 'jarak_rumah_ke_sekolah', label: 'Jarak Rumah ke Sekolah' },
      { key: 'waktu_tempuh', label: 'Waktu Tempuh ke Sekolah' }
    ];

    // Jika jarak > 1km, maka sebutkan_kilometer wajib diisi
    if (formData.jarak_rumah_ke_sekolah === '2' && (!formData.sebutkan_kilometer || formData.sebutkan_kilometer.trim() === '')) {
      setErrorMessage('Gagal menyimpan: Field "Sebutkan (Berapa Kilometer)" wajib diisi jika jarak lebih dari 1 Km.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    // Cek field kosong
    for (const field of requiredFields) {
      if (!formData[field.key] || formData[field.key].toString().trim() === '') {
        setErrorMessage(`Gagal menyimpan: Field "${field.label}" wajib diisi.`);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    setIsSaving(true);
    
    try {
      const payload = {
        action: 'update_profile',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        tempat_lahir: String(formData.tempat_lahir || ''),
        tanggal_lahir: String(formData.tanggal_lahir || ''),
        nik: String(formData.nik || ''),
        agama: String(formData.agama || ''),
        no_kk: String(formData.no_kk || ''),
        reg_akta_lahir: String(formData.reg_akta_lahir || ''),
        jk: String(formData.jk || ''),
        alamat_jalan: String(formData.alamat_jalan || ''),
        rt: String(formData.rt || ''),
        rw: String(formData.rw || ''),
        kel: String(formData.kel || ''),
        kec: String(formData.kec || ''),
        kab_kota: String(formData.kab_kota || ''),
        kode_pos: String(formData.kode_pos || ''),
        jenis_tinggal: String(formData.jenis_tinggal || ''),
        alat_transportasi: String(formData.alat_transportasi || ''),
        no_hp: String(formData.no_hp || ''),
        email: String(formData.email || ''),
        rombel: String(formData.rombel || ''),
        jurusan: String(formData.jurusan || ''),
        nama_ayah: String(formData.nama_ayah || ''),
        nik_ayah: String(formData.nik_ayah || ''),
        tahun_lahir_ayah: String(formData.tahun_lahir_ayah || ''),
        jenjang_pendidikan_ayah: String(formData.jenjang_pendidikan_ayah || ''),
        pekerjaan_ayah: String(formData.pekerjaan_ayah || ''),
        penghasilan_ayah: String(formData.penghasilan_ayah || ''),
        nama_ibu: String(formData.nama_ibu || ''),
        nik_ibu: String(formData.nik_ibu || ''),
        tahun_lahir_ibu: String(formData.tahun_lahir_ibu || ''),
        jenjang_pendidikan_ibu: String(formData.jenjang_pendidikan_ibu || ''),
        pekerjaan_ibu: String(formData.pekerjaan_ibu || ''),
        penghasilan_ibu: String(formData.penghasilan_ibu || ''),
        sekolah_asal: String(formData.sekolah_asal || ''),
        id_hobby: String(formData.id_hobby || ''),
        id_cita: String(formData.id_cita || ''),
        no_peserta_ujian: String(formData.no_peserta_ujian || ''),
        no_seri_ijazah: String(formData.no_seri_ijazah || ''),
        tinggi_badan: String(formData.tinggi_badan || ''),
        berat_badan: String(formData.berat_badan || ''),
        lingkar_kepala: String(formData.lingkar_kepala || ''),
        jumlah_saudara_kandung: String(formData.jumlah_saudara_kandung || ''),
        anak_ke: String(formData.anak_ke || ''),
        jarak_rumah_ke_sekolah: String(formData.jarak_rumah_ke_sekolah || ''),
        "Sebutkan_(Berapa_Kilometer)": String(formData.sebutkan_kilometer || ''),
        "waktu_tempuh_ke_sekolah_(menit)": String(formData.waktu_tempuh || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        jenis_kartu: String(formData.jenis_kartu || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        status_verval: String(formData.status_verval || ''),
        data_salah: Array.isArray(formData.data_salah) ? formData.data_salah.join(', ') : '',
        nama_verval: String(formData.nama_verval || ''),
        tempat_lahir_verval: String(formData.tempat_lahir_verval || ''),
        tanggal_lahir_verval: String(formData.tanggal_lahir_verval || '')
      };

      console.log('Sending full periodik data to Google Sheet...');
      
      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key as keyof typeof payload]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Pastikan koneksi internet stabil.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Data Periodik Peserta Didik</h1>
        <p className="text-xs sm:text-sm text-slate-400">Lengkapi data periodik siswa untuk pemantauan perkembangan fisik.</p>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data periodik berhasil diperbarui." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> Informasi Fisik & Keluarga
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tinggi Badan (cm) <span className="text-red-500">*</span></label>
              <input name="tinggi_badan" value={formData.tinggi_badan} onChange={handleInputChange} type="text" placeholder="Contoh: 165" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Berat Badan (kg) <span className="text-red-500">*</span></label>
              <input name="berat_badan" value={formData.berat_badan} onChange={handleInputChange} type="text" placeholder="Contoh: 55" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lingkar Kepala (cm) <span className="text-red-500">*</span></label>
              <input name="lingkar_kepala" value={formData.lingkar_kepala} onChange={handleInputChange} type="text" placeholder="Contoh: 54" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah Saudara Kandung <span className="text-red-500">*</span></label>
              <input name="jumlah_saudara_kandung" value={formData.jumlah_saudara_kandung} onChange={handleInputChange} type="text" placeholder="Contoh: 2" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anak Ke <span className="text-red-500">*</span></label>
              <input name="anak_ke" value={formData.anak_ke} onChange={handleInputChange} type="text" placeholder="Contoh: 1" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" /> Jarak & Waktu Tempuh
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jarak Rumah ke Sekolah <span className="text-red-500">*</span></label>
              <select name="jarak_rumah_ke_sekolah" value={formData.jarak_rumah_ke_sekolah} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Jarak</option>
                <option value="1">Kurang dari 1 Km</option>
                <option value="2">Lebih dari 1 Km</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sebutkan (Berapa Kilometer) {formData.jarak_rumah_ke_sekolah === '2' && <span className="text-red-500">*</span>}</label>
              <input 
                name="sebutkan_kilometer" 
                value={formData.sebutkan_kilometer} 
                onChange={handleInputChange} 
                type="text" 
                placeholder={formData.jarak_rumah_ke_sekolah === '1' ? "Tidak perlu diisi" : "Contoh: 5"}
                disabled={formData.jarak_rumah_ke_sekolah === '1'}
                className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all ${formData.jarak_rumah_ke_sekolah === '1' ? 'opacity-50 cursor-not-allowed bg-slate-800/50' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu Tempuh ke Sekolah (Menit) <span className="text-red-500">*</span></label>
              <input name="waktu_tempuh" value={formData.waktu_tempuh} onChange={handleInputChange} type="text" placeholder="Contoh: 15" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Data Periodik
          </button>
        </div>
      </div>
    </div>
  );
}

function KurangMampuView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 2MB for base64 transfer
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimal 2MB.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setUploadProgress(prev => ({ ...prev, [field]: true }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Buat URL sementara (Blob) agar browser bisa membuka file dengan aman
      const blob = new Blob([file], { type: file.type });
      const previewUrl = URL.createObjectURL(blob);
      
      setFormData((prev: any) => ({
        ...prev,
        [field]: base64,
        [`${field}_preview`]: previewUrl // Simpan URL pratinjau sementara
      }));
      setUploadProgress(prev => ({ ...prev, [field]: false }));
    };
    reader.readAsDataURL(file);
  };

  // Clear related data based on logic
  useEffect(() => {
    if (formData.kurang_mampu === 'Tidak') {
      setFormData((prev: any) => ({
        ...prev,
        ket_kip: '',
        no_kip: '',
        nama_di_kip: '',
        kartu_lain: '',
        nama_dikartu: '',
        no_kartu: '',
        upload_kip: '',
        upload_kartu: ''
      }));
    } else if (formData.kurang_mampu === 'Ya') {
      if (formData.ket_kip === 'Tidak') {
        setFormData((prev: any) => ({
          ...prev,
          no_kip: '',
          nama_di_kip: '',
          upload_kip: ''
        }));
      }
      if (!formData.kartu_lain) {
        setFormData((prev: any) => ({
          ...prev,
          nama_dikartu: '',
          no_kartu: '',
          upload_kartu: ''
        }));
      }
    }
  }, [formData.kurang_mampu, formData.ket_kip, formData.kartu_lain, setFormData]);

  const handleSave = async () => {
    // Validasi
    if (!formData.kurang_mampu) {
      setErrorMessage('Gagal menyimpan: Field "Kurang Mampu" wajib diisi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    if (formData.kurang_mampu === 'Ya') {
      if (!formData.ket_kip) {
        setErrorMessage('Gagal menyimpan: Field "Keterangan KIP" wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
      if (formData.ket_kip === 'Ya') {
        if (!formData.no_kip || !formData.nama_di_kip) {
          setErrorMessage('Gagal menyimpan: Data KIP (Nomor & Nama) wajib diisi.');
          setShowError(true);
          setTimeout(() => setShowError(false), 4000);
          return;
        }
        if (!formData.upload_kip) {
          setErrorMessage('Gagal menyimpan: Foto KIP wajib diupload.');
          setShowError(true);
          setTimeout(() => setShowError(false), 4000);
          return;
        }
      }

      const kartuLainWajib = ['PKH', 'KKS', 'SKTM'];
      if (kartuLainWajib.includes(formData.kartu_lain)) {
        if (!formData.nama_dikartu || !formData.no_kartu) {
          setErrorMessage(`Gagal menyimpan: Data Kartu ${formData.kartu_lain} (Nomor & Nama) wajib diisi.`);
          setShowError(true);
          setTimeout(() => setShowError(false), 4000);
          return;
        }
        if (!formData.upload_kartu) {
          setErrorMessage(`Gagal menyimpan: Foto Kartu ${formData.kartu_lain} wajib diupload.`);
          setShowError(true);
          setTimeout(() => setShowError(false), 4000);
          return;
        }
      }
    }

    setIsSaving(true);
    
    try {
      const payload = {
        action: 'save_kurang_mampu',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        rombel: String(formData.rombel || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        ket_kip: String(formData.ket_kip || ''),
        no_kip: String(formData.no_kip || ''),
        nama_di_kip: String(formData.nama_di_kip || ''),
        kartu_lain: String(formData.kartu_lain || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        upload_kip: String(formData.upload_kip || ''),
        upload_kartu: String(formData.upload_kartu || '')
      };

      console.log('Sending data to sheet "kurangmampu"...');
      
      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key as keyof typeof payload]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Pastikan koneksi internet stabil.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pendataan Siswa Kurang Mampu</h1>
        <p className="text-xs sm:text-sm text-slate-400">Lengkapi informasi bantuan sosial dan kartu kesejahteraan siswa pada sheet khusus.</p>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data berhasil disimpan ke sheet kurangmampu." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Info Dasar (Read Only) */}
        <div className="glass-card p-4 sm:p-8 space-y-6 opacity-80">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> Informasi Identitas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</label>
              <input value={formData.nama} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN</label>
              <input value={formData.nisn} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rombel</label>
              <input value={formData.rombel} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Status Utama */}
        <div className="glass-card p-4 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" /> Status Kesejahteraan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Apakah Anda Termasuk Siswa Kurang Mampu <span className="text-red-500">*</span></label>
              <select name="kurang_mampu" value={formData.kurang_mampu} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                <option value="">Pilih Status</option>
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
              </select>
            </div>
          </div>
        </div>

        {formData.kurang_mampu === 'Ya' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Bagian KIP */}
            <div className="glass-card p-4 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" /> Kepemilikan KIP
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Memiliki KIP? <span className="text-red-500">*</span></label>
                  <select name="ket_kip" value={formData.ket_kip} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                    <option value="">Pilih Jawaban</option>
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </div>
              </div>

              {formData.ket_kip === 'Ya' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. KIP <span className="text-red-500">*</span></label>
                    <input name="no_kip" value={formData.no_kip} onChange={handleInputChange} type="text" placeholder="Masukkan nomor KIP..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama di KIP <span className="text-red-500">*</span></label>
                    <input name="nama_di_kip" value={formData.nama_di_kip} onChange={handleInputChange} type="text" placeholder="Nama sesuai di kartu KIP..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Foto KIP <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'upload_kip')}
                        className="hidden" 
                        id="file-kip"
                      />
                      <label 
                        htmlFor="file-kip"
                        className="flex items-center justify-between w-full bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {uploadProgress['upload_kip'] ? (
                            <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 text-purple-400" />
                          )}
                          <span className="text-sm text-slate-400">
                            {formData.upload_kip?.startsWith('data:') ? 'File terpilih (Siap upload)' : 'Pilih file KIP (JPG/PNG/PDF)'}
                          </span>
                        </div>
                        {formData.upload_kip && (
                          <a 
                            href={formData.upload_kip_preview || formData.upload_kip} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> {formData.upload_kip.startsWith('data:') ? 'Pratinjau File' : 'Lihat File'}
                          </a>
                        )}
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bagian Kartu Lain */}
            <div className="glass-card p-4 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Kartu Kesejahteraan Lainnya
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kartu Lain</label>
                  <select name="kartu_lain" value={formData.kartu_lain} onChange={handleInputChange} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all">
                    <option value="">Tidak Ada</option>
                    <option value="PKH">PKH</option>
                    <option value="KKS">KKS</option>
                    <option value="SKTM">SKTM</option>
                  </select>
                </div>
              </div>

              {formData.kartu_lain && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama di Kartu ({formData.kartu_lain}) <span className="text-red-500">*</span></label>
                    <input name="nama_dikartu" value={formData.nama_dikartu} onChange={handleInputChange} type="text" placeholder="Nama sesuai di kartu..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. Kartu ({formData.kartu_lain}) <span className="text-red-500">*</span></label>
                    <input name="no_kartu" value={formData.no_kartu} onChange={handleInputChange} type="text" placeholder="Masukkan nomor kartu..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Foto Kartu {formData.kartu_lain} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(e, 'upload_kartu')}
                        className="hidden" 
                        id="file-kartu"
                      />
                      <label 
                        htmlFor="file-kartu"
                        className="flex items-center justify-between w-full bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 cursor-pointer hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {uploadProgress['upload_kartu'] ? (
                            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 text-emerald-400" />
                          )}
                          <span className="text-sm text-slate-400">
                            {formData.upload_kartu?.startsWith('data:') ? 'File terpilih (Siap upload)' : `Pilih file ${formData.kartu_lain} (JPG/PNG/PDF)`}
                          </span>
                        </div>
                        {formData.upload_kartu && (
                          <a 
                            href={formData.upload_kartu_preview || formData.upload_kartu} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> {formData.upload_kartu.startsWith('data:') ? 'Pratinjau File' : 'Lihat File'}
                          </a>
                        )}
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-12 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
          >
            {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan ke Sheet Kurang Mampu
          </button>
        </div>
      </div>
    </div>
  );
}

function VervalView({ formData, handleInputChange, setFormData }: { formData: any, handleInputChange: any, setFormData: any }) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 2MB for base64 transfer
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran file terlalu besar. Maksimal 2MB.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    setUploadProgress(prev => ({ ...prev, [field]: true }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Buat URL sementara (Blob) agar browser bisa membuka file dengan aman
      const blob = new Blob([file], { type: file.type });
      const previewUrl = URL.createObjectURL(blob);
      
      setFormData((prev: any) => ({
        ...prev,
        [field]: base64,
        [`${field}_preview`]: previewUrl // Simpan URL pratinjau sementara
      }));
      setUploadProgress(prev => ({ ...prev, [field]: false }));
    };
    reader.readAsDataURL(file);
  };

  const handleCheckboxChange = (value: string) => {
    const currentSalah = Array.isArray(formData.data_salah) ? formData.data_salah : [];
    if (currentSalah.includes(value)) {
      setFormData((prev: any) => ({
        ...prev,
        data_salah: currentSalah.filter((item: string) => item !== value),
        // Clear corresponding field if unchecked
        ...(value === 'nama' ? { nama_verval: '' } : {}),
        ...(value === 'tempat lahir' ? { tempat_lahir_verval: '' } : {}),
        ...(value === 'tanggal lahir' ? { tanggal_lahir_verval: '' } : {})
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        data_salah: [...currentSalah, value]
      }));
    }
  };

  const handleCheckboxChangeKK = (value: string) => {
    const currentSalah = Array.isArray(formData.data_salah_kk) ? formData.data_salah_kk : [];
    if (currentSalah.includes(value)) {
      setFormData((prev: any) => ({
        ...prev,
        data_salah_kk: currentSalah.filter((item: string) => item !== value),
        // Clear corresponding field if unchecked
        ...(value === 'nama' ? { nama_kk: '' } : {}),
        ...(value === 'tempat lahir' ? { tempat_lahir_kk: '' } : {}),
        ...(value === 'tanggal lahir' ? { tanggal_lahir_kk: '' } : {})
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        data_salah_kk: [...currentSalah, value]
      }));
    }
  };

  // Clear Verval data if status_verval is 'Ya'
  useEffect(() => {
    if (formData.status_verval === 'Ya') {
      setFormData((prev: any) => ({
        ...prev,
        data_salah: [],
        nama_verval: '',
        tempat_lahir_verval: '',
        tanggal_lahir_verval: '',
        upload_ijazah: '',
        upload_ijazah_preview: ''
      }));
    }
  }, [formData.status_verval, setFormData]);

  // Clear KK data if status_kk is 'Ya'
  useEffect(() => {
    if (formData.status_kk === 'Ya') {
      setFormData((prev: any) => ({
        ...prev,
        data_salah_kk: [],
        nama_kk: '',
        tempat_lahir_kk: '',
        tanggal_lahir_kk: '',
        upload_kk: '',
        upload_kk_preview: ''
      }));
    }
  }, [formData.status_kk, setFormData]);

  const handleNext = () => {
    if (!formData.status_verval) {
      setErrorMessage('Gagal: Field "Status Verval Ijazah" wajib diisi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    if (formData.status_verval === 'Tidak') {
      if (!formData.data_salah || formData.data_salah.length === 0) {
        setErrorMessage('Gagal: Pilih minimal satu data ijazah yang salah.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }

      if (formData.data_salah.includes('nama') && !formData.nama_verval) {
        setErrorMessage('Gagal: Nama sesuai ijazah wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
      if (formData.data_salah.includes('tempat lahir') && !formData.tempat_lahir_verval) {
        setErrorMessage('Gagal: Tempat lahir sesuai ijazah wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
      if (formData.data_salah.includes('tanggal lahir') && !formData.tanggal_lahir_verval) {
        setErrorMessage('Gagal: Tanggal lahir sesuai ijazah wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }

      if (!formData.upload_ijazah) {
        setErrorMessage('Gagal: File Ijazah wajib diunggah.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!formData.status_kk) {
      setErrorMessage('Gagal menyimpan: Field "Status Verval KK" wajib diisi.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
      return;
    }

    if (formData.status_kk === 'Tidak') {
      if (!formData.data_salah_kk || formData.data_salah_kk.length === 0) {
        setErrorMessage('Gagal menyimpan: Pilih minimal satu data KK yang salah.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }

      if (formData.data_salah_kk.includes('nama') && !formData.nama_kk) {
        setErrorMessage('Gagal menyimpan: Nama sesuai KK wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
      if (formData.data_salah_kk.includes('tempat lahir') && !formData.tempat_lahir_kk) {
        setErrorMessage('Gagal menyimpan: Tempat lahir sesuai KK wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
      if (formData.data_salah_kk.includes('tanggal lahir') && !formData.tanggal_lahir_kk) {
        setErrorMessage('Gagal menyimpan: Tanggal lahir sesuai KK wajib diisi.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }

      if (!formData.upload_kk) {
        setErrorMessage('Gagal menyimpan: File KK wajib diunggah.');
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        action: 'update_profile',
        nipd: String(formData.nipd || ''),
        nisn: String(formData.nisn || ''),
        nama: String(formData.nama || ''),
        tempat_lahir: String(formData.tempat_lahir || ''),
        tanggal_lahir: String(formData.tanggal_lahir || ''),
        nik: String(formData.nik || ''),
        agama: String(formData.agama || ''),
        no_kk: String(formData.no_kk || ''),
        reg_akta_lahir: String(formData.reg_akta_lahir || ''),
        jk: String(formData.jk || ''),
        alamat_jalan: String(formData.alamat_jalan || ''),
        rt: String(formData.rt || ''),
        rw: String(formData.rw || ''),
        kel: String(formData.kel || ''),
        kec: String(formData.kec || ''),
        kab_kota: String(formData.kab_kota || ''),
        kode_pos: String(formData.kode_pos || ''),
        jenis_tinggal: String(formData.jenis_tinggal || ''),
        alat_transportasi: String(formData.alat_transportasi || ''),
        no_hp: String(formData.no_hp || ''),
        email: String(formData.email || ''),
        rombel: String(formData.rombel || ''),
        jurusan: String(formData.jurusan || ''),
        nama_ayah: String(formData.nama_ayah || ''),
        nik_ayah: String(formData.nik_ayah || ''),
        tahun_lahir_ayah: String(formData.tahun_lahir_ayah || ''),
        jenjang_pendidikan_ayah: String(formData.jenjang_pendidikan_ayah || ''),
        pekerjaan_ayah: String(formData.pekerjaan_ayah || ''),
        penghasilan_ayah: String(formData.penghasilan_ayah || ''),
        nama_ibu: String(formData.nama_ibu || ''),
        nik_ibu: String(formData.nik_ibu || ''),
        tahun_lahir_ibu: String(formData.tahun_lahir_ibu || ''),
        jenjang_pendidikan_ibu: String(formData.jenjang_pendidikan_ibu || ''),
        pekerjaan_ibu: String(formData.pekerjaan_ibu || ''),
        penghasilan_ibu: String(formData.penghasilan_ibu || ''),
        sekolah_asal: String(formData.sekolah_asal || ''),
        id_hobby: String(formData.id_hobby || ''),
        id_cita: String(formData.id_cita || ''),
        no_peserta_ujian: String(formData.no_peserta_ujian || ''),
        no_seri_ijazah: String(formData.no_seri_ijazah || ''),
        tinggi_badan: String(formData.tinggi_badan || ''),
        berat_badan: String(formData.berat_badan || ''),
        lingkar_kepala: String(formData.lingkar_kepala || ''),
        jumlah_saudara_kandung: String(formData.jumlah_saudara_kandung || ''),
        anak_ke: String(formData.anak_ke || ''),
        jarak_rumah_ke_sekolah: String(formData.jarak_rumah_ke_sekolah || ''),
        "Sebutkan_(Berapa_Kilometer)": String(formData.sebutkan_kilometer || ''),
        "waktu_tempuh_ke_sekolah_(menit)": String(formData.waktu_tempuh || ''),
        kurang_mampu: String(formData.kurang_mampu || ''),
        jenis_kartu: String(formData.jenis_kartu || ''),
        nama_dikartu: String(formData.nama_dikartu || ''),
        no_kartu: String(formData.no_kartu || ''),
        status_verval: String(formData.status_verval || ''),
        data_salah: Array.isArray(formData.data_salah) ? formData.data_salah.join(', ') : '',
        nama_verval: String(formData.nama_verval || ''),
        tempat_lahir_verval: String(formData.tempat_lahir_verval || ''),
        tanggal_lahir_verval: String(formData.tanggal_lahir_verval || ''),
        upload_ijazah: String(formData.upload_ijazah || ''),
        upload_ijazah_folder: '1G4nkVwTctb8YCoXMAdzEPGOVVDFVaMDX',
        upload_ijazah_filename: `${formData.nisn}_${formData.nama}_ijazah`,
        status_kk: String(formData.status_kk || ''),
        data_salah_kk: Array.isArray(formData.data_salah_kk) ? formData.data_salah_kk.join(', ') : '',
        nama_kk: String(formData.nama_kk || ''),
        tempat_lahir_kk: String(formData.tempat_lahir_kk || ''),
        tanggal_lahir_kk: String(formData.tanggal_lahir_kk || ''),
        upload_kk: String(formData.upload_kk || ''),
        upload_kk_folder: '1G4nkVwTctb8YCoXMAdzEPGOVVDFVaMDX',
        upload_kk_filename: `${formData.nisn}_${formData.nama}_kk`
      };

      const params = new URLSearchParams();
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key as keyof typeof payload]);
      });

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params
      });

      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      setIsSaving(false);
      setErrorMessage('Gagal menyimpan data. Pastikan koneksi internet stabil.');
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Verval Data</h1>
        <p className="text-xs sm:text-sm text-slate-400">Verifikasi kesesuaian data identitas Anda dengan dokumen Ijazah dan Kartu Keluarga.</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 mb-8">
        <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${step === 1 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-500'}`}>
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs ${step === 1 ? 'bg-white text-purple-500' : 'bg-slate-800 text-slate-500'}`}>1</span>
          Verval Ijazah
        </div>
        <div className="w-4 sm:w-8 h-px bg-white/10" />
        <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${step === 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500'}`}>
          <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs ${step === 2 ? 'bg-white text-blue-500' : 'bg-slate-800 text-slate-500'}`}>2</span>
          Verval KK
        </div>
      </div>

      <StatusModal 
        show={showSuccess} 
        type="success" 
        message="Data verval berhasil diperbarui." 
        onClose={() => setShowSuccess(false)} 
      />
      <StatusModal 
        show={showError} 
        type="error" 
        message={errorMessage} 
        onClose={() => setShowError(false)} 
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
          <div className="glass-card p-4 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Data Induk Ijazah
            </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                    <input value={formData.nama} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempat Lahir</label>
                    <input value={formData.tempat_lahir} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Lahir</label>
                    <input value={formData.tanggal_lahir} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-400" /> Verifikasi Ijazah
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Apakah data diatas sudah sesuai dengan data di Ijazah Anda? <span className="text-red-500">*</span></label>
                    <div className="flex flex-col gap-3">
                      {['Ya', 'Tidak'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => setFormData((prev: any) => ({ ...prev, status_verval: option }))}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              formData.status_verval === option 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-white/20 group-hover:border-purple-500/50'
                            }`}
                          >
                            {formData.status_verval === option && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            )}
                          </div>
                          <span className={`text-sm font-medium transition-colors ${formData.status_verval === option ? 'text-white' : 'text-slate-400'}`}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.status_verval === 'Tidak' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-4 border-t border-white/5"
                    >
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">Data apa yang tidak sesuai? (Bisa pilih lebih dari satu) <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-4">
                          {['nama', 'tempat lahir', 'tanggal lahir'].map((item) => (
                            <label key={item} className="flex items-center gap-2 cursor-pointer group">
                              <div 
                                onClick={() => handleCheckboxChange(item)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.data_salah?.includes(item) ? 'bg-purple-500 border-purple-500' : 'border-white/20 group-hover:border-purple-500/50'}`}
                              >
                                {formData.data_salah?.includes(item) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className="text-sm text-slate-400 capitalize">{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {formData.data_salah?.includes('nama') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Sesuai Ijazah <span className="text-red-500">*</span></label>
                            <input name="nama_verval" value={formData.nama_verval} onChange={handleInputChange} type="text" placeholder="Masukkan nama sesuai ijazah..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all" />
                          </motion.div>
                        )}
                        {formData.data_salah?.includes('tempat lahir') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempat Lahir Sesuai Ijazah <span className="text-red-500">*</span></label>
                            <input name="tempat_lahir_verval" value={formData.tempat_lahir_verval} onChange={handleInputChange} type="text" placeholder="Masukkan tempat lahir sesuai ijazah..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all" />
                          </motion.div>
                        )}
                        {formData.data_salah?.includes('tanggal lahir') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Lahir Sesuai Ijazah <span className="text-red-500">*</span></label>
                            <input name="tanggal_lahir_verval" value={formData.tanggal_lahir_verval} onChange={handleInputChange} type="date" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all" />
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Ijazah <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'upload_ijazah')}
                            className="hidden" 
                            id="file-ijazah"
                          />
                          <label 
                            htmlFor="file-ijazah"
                            className="flex items-center justify-between w-full bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 cursor-pointer hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {uploadProgress['upload_ijazah'] ? (
                                <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 text-purple-400" />
                              )}
                              <span className="text-sm text-slate-400">
                                {formData.upload_ijazah?.startsWith('data:') ? 'File Ijazah terpilih (Siap upload)' : 'Pilih file Ijazah (JPG/PNG/PDF)'}
                              </span>
                            </div>
                            {formData.upload_ijazah && (
                              <a 
                                href={formData.upload_ijazah_preview || formData.upload_ijazah} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> {formData.upload_ijazah.startsWith('data:') ? 'Pratinjau File' : 'Lihat File'}
                              </a>
                            )}
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">Format nama file otomatis: {formData.nisn}_{formData.nama}_ijazah</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end pt-4 gap-4">
                <button 
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 group"
                >
                  Selanjutnya (Verval KK)
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="glass-card p-4 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" /> Data Kartu Keluarga Saat Ini
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap (Sesuai KK)</label>
                    <input value={formData.nama} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempat Lahir (Sesuai KK)</label>
                    <input value={formData.tempat_lahir} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Lahir (Sesuai KK)</label>
                    <input value={formData.tanggal_lahir} disabled className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 opacity-70 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold border-b border-white/5 pb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-400" /> Verifikasi Kartu Keluarga
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Apakah data diatas sudah sesuai dengan data di Kartu Keluarga Anda? <span className="text-red-500">*</span></label>
                    <div className="flex flex-col gap-3">
                      {['Ya', 'Tidak'].map((option) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => setFormData((prev: any) => ({ ...prev, status_kk: option }))}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              formData.status_kk === option 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-white/20 group-hover:border-blue-500/50'
                            }`}
                          >
                            {formData.status_kk === option && (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                          </div>
                          <span className={`text-sm font-medium transition-colors ${formData.status_kk === option ? 'text-white' : 'text-slate-400'}`}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.status_kk === 'Tidak' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 pt-4 border-t border-white/5"
                    >
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-300">Data apa yang tidak sesuai? (Bisa pilih lebih dari satu) <span className="text-red-500">*</span></label>
                        <div className="flex flex-wrap gap-4">
                          {['nama', 'tempat lahir', 'tanggal lahir'].map((item) => (
                            <label key={item} className="flex items-center gap-2 cursor-pointer group">
                              <div 
                                onClick={() => handleCheckboxChangeKK(item)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${formData.data_salah_kk?.includes(item) ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-blue-500/50'}`}
                              >
                                {formData.data_salah_kk?.includes(item) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className="text-sm text-slate-400 capitalize">{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {formData.data_salah_kk?.includes('nama') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Sesuai KK <span className="text-red-500">*</span></label>
                            <input name="nama_kk" value={formData.nama_kk} onChange={handleInputChange} type="text" placeholder="Masukkan nama sesuai KK..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
                          </motion.div>
                        )}
                        {formData.data_salah_kk?.includes('tempat lahir') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempat Lahir Sesuai KK <span className="text-red-500">*</span></label>
                            <input name="tempat_lahir_kk" value={formData.tempat_lahir_kk} onChange={handleInputChange} type="text" placeholder="Masukkan tempat lahir sesuai KK..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
                          </motion.div>
                        )}
                        {formData.data_salah_kk?.includes('tanggal lahir') && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Lahir Sesuai KK <span className="text-red-500">*</span></label>
                            <input name="tanggal_lahir_kk" value={formData.tanggal_lahir_kk} onChange={handleInputChange} type="date" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500/50 transition-all" />
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-white/5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upload Kartu Keluarga <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(e, 'upload_kk')}
                            className="hidden" 
                            id="file-kk"
                          />
                          <label 
                            htmlFor="file-kk"
                            className="flex items-center justify-between w-full bg-white/5 border border-dashed border-white/20 rounded-xl py-3 px-4 cursor-pointer hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {uploadProgress['upload_kk'] ? (
                                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5 text-blue-400" />
                              )}
                              <span className="text-sm text-slate-400">
                                {formData.upload_kk?.startsWith('data:') ? 'File KK terpilih (Siap upload)' : 'Pilih file Kartu Keluarga (JPG/PNG/PDF)'}
                              </span>
                            </div>
                            {formData.upload_kk && (
                              <a 
                                href={formData.upload_kk_preview || formData.upload_kk} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> {formData.upload_kk.startsWith('data:') ? 'Pratinjau File' : 'Lihat File'}
                              </a>
                            )}
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">Format nama file otomatis: {formData.nisn}_{formData.nama}_kk</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-all border border-white/10 flex items-center justify-center gap-3"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Kembali
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Semua Data Verval
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NotifikasiView({ notifications }: { notifications: any[] }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifikasi Saya</h1>
        <p className="text-xs sm:text-sm text-slate-400">Pesan dan pengumuman penting khusus untuk Anda.</p>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif, idx) => {
            const type = (notif.tipe || 'info').toLowerCase().trim();
            const isWarning = type === 'warning';
            const isError = type === 'error';
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-2xl border transition-all group ${
                  isWarning ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' :
                  isError ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40' :
                  'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`mt-1.5 w-4 h-4 rounded-full shrink-0 shadow-[0_0_15px] ${
                    isWarning ? 'bg-amber-500 shadow-amber-500/50' : 
                    isError ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50'
                  }`} />
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className={`text-lg font-bold transition-colors ${
                        isWarning ? 'text-amber-200 group-hover:text-amber-100' :
                        isError ? 'text-red-200 group-hover:text-red-100' :
                        'text-white group-hover:text-blue-200'
                      }`}>
                        {notif.judul || 'Pemberitahuan'}
                      </p>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {notif.tanggal || 'Baru Saja'}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                      {notif.pesan || notif.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Bell className="w-8 h-8 text-slate-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-400">Tidak ada notifikasi</h3>
              <p className="text-sm text-slate-500">Semua pesan penting akan muncul di sini.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
