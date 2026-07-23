import React, { useState, useMemo } from "react";
import { Users, ShieldCheck, Terminal, Settings, AlertTriangle, Check, Trash2, Edit, Save, Server, Database } from "lucide-react";
import { ActivityLog } from "../types.js";
import { formatDate } from "../utils/format.js";
import { api } from "../services/api.js";

interface AdminViewProps {
  logs: ActivityLog[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ logs, showToast }) => {
  const [qrisUrl, setQrisUrl] = useState("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KitaPunya-QRIS-Merchant-ID-1988273891");
  const [qrisLabel, setQrisLabel] = useState("KitaPunya Premium Merchant");
  const [isInitializingDb, setIsInitializingDb] = useState(false);
  const [dbInitLog, setDbInitLog] = useState("");
  const [showDbConsole, setShowDbConsole] = useState(false);

  const handleInitializeDatabase = async () => {
    setIsInitializingDb(true);
    setDbInitLog("Memulai koneksi...\n");
    setShowDbConsole(true);
    try {
      const res = await api.initializeDatabaseSchema();
      setDbInitLog(res.log);
      if (res.success) {
        showToast("Basis data Supabase berhasil dimigrasi & di-seed!", "success");
      } else {
        showToast("Error saat migrasi basis data.", "error");
      }
    } catch (err: any) {
      setDbInitLog(prev => prev + `\nERROR SISTEM: ${err.message || err}`);
      showToast("Gagal berkomunikasi dengan server.", "error");
    } finally {
      setIsInitializingDb(false);
    }
  };

  // Mock list of registered users
  const [users, setUsers] = useState([
    { id: "u-1", name: "Ahmad Saufi", email: "saufi@kitapunya.id", role: "admin", status: "active" },
    { id: "u-2", name: "Sarah Amanda", email: "sarah@kitapunya.id", role: "user", status: "active" },
    { id: "u-3", name: "Rian Hidayat", email: "rian@gmail.com", role: "user", status: "active" },
    { id: "u-4", name: "Aisyah Zahra", email: "aisyah@outlook.com", role: "user", status: "suspended" },
  ]);

  const handleToggleRole = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextRole = u.role === "admin" ? "user" : "admin";
        showToast(`Peran ${u.name} diubah menjadi ${nextRole}!`, "info");
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u && confirm(`Apakah Anda yakin ingin menghapus pengguna "${u.name}"?`)) {
      setUsers(prev => prev.filter(x => x.id !== userId));
      showToast(`Pengguna ${u.name} telah dikeluarkan dari sistem.`, "success");
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Konfigurasi QRIS & Pengaturan Merchant berhasil disimpan!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Admin Control & System Panel
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-1">
          Pantau status basis data, log aktivitas, lakukan konfigurasi QRIS, serta atur izin anggota sistem.
        </p>
      </div>

      {/* Database/Server Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Server size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Status Server</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">AKTIF (Lancar)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-2xl">
            <Database size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Database Storage</span>
            <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">Supabase Postgres</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Model Kecerdasan Buatan</span>
            <span className="text-sm font-black text-indigo-500">Google Gemini Flash</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            Daftar Pengguna Terdaftar
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Nama & Emel</th>
                  <th className="pb-3">Peran</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 font-semibold transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{u.name}</div>
                      <div className="text-xs text-zinc-400 font-medium">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${u.role === "admin" ? "bg-red-100 dark:bg-red-950/20 text-red-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${u.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} title={u.status} />
                    </td>
                    <td className="py-3 text-center pr-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleRole(u.id)}
                          className="px-2.5 py-1 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                          title="Ubah Peran"
                        >
                          Ubah Peran
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
                          title="Hapus Pengguna"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          {/* Card 1: QRIS / Settings configuration */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Settings size={18} className="text-emerald-600" />
              Konfigurasi Merchant QRIS
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-1.5">
                  Merchant Name Label
                </label>
                <input
                  type="text"
                  value={qrisLabel}
                  onChange={(e) => setQrisLabel(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase mb-1.5">
                  QRIS Code Payload URL
                </label>
                <textarea
                  rows={3}
                  value={qrisUrl}
                  onChange={(e) => setQrisUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Save size={14} />
                Simpan Pengaturan QRIS
              </button>
            </form>

            {/* QR Code preview */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-3">Silakan Uji Kode QRIS Anda</span>
              <div className="p-3 bg-white border border-zinc-200 rounded-2xl w-40 h-40">
                <img src={qrisUrl} alt="QRIS QR Preview" className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-black mt-2 text-zinc-800 dark:text-zinc-200">{qrisLabel}</span>
            </div>
          </div>

          {/* Card 2: Supabase Database Manager */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Database size={18} className="text-violet-600" />
              Sinkronisasi & Migrasi Supabase
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
              Buat tabel skema Drizzle secara otomatis dan masukkan (seed) catatan profil dasar ke dalam proyek basis data Supabase Anda.
            </p>

            <button
              onClick={handleInitializeDatabase}
              disabled={isInitializingDb}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isInitializingDb 
                  ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed" 
                  : "bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
              }`}
            >
              <Server size={14} className={isInitializingDb ? "animate-spin" : ""} />
              {isInitializingDb ? "Sedang Membuat..." : "Migrasi & Seed Supabase"}
            </button>

            {showDbConsole && (
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Konsol Migrasi</span>
                  <button 
                    onClick={() => setDbInitLog("")} 
                    className="text-[9px] font-bold text-zinc-400 hover:text-zinc-600"
                  >
                    Bersihkan
                  </button>
                </div>
                <div className="bg-zinc-950 text-zinc-300 font-mono text-[10px] p-3 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {dbInitLog}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs (Terminal View) */}
      <div className="bg-zinc-950 text-zinc-200 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">
            <Terminal size={16} className="text-emerald-400" />
            Konsol Log Sistem Terperinci (Live Feed)
          </h3>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
            Live Monitoring
          </span>
        </div>

        <div className="font-mono text-xs overflow-y-auto max-h-56 space-y-1 bg-black/40 p-4 rounded-xl border border-zinc-900 leading-relaxed scrollbar-thin">
          {logs.map((log) => (
            <div key={log.id} className="hover:bg-zinc-900/40 p-1 rounded">
              <span className="text-zinc-500">[{formatDate(log.createdAt)}]</span>{" "}
              <span className="text-violet-400">INFO:</span>{" "}
              <span className="text-zinc-300">{log.action}</span>{" "}
              <span className="text-emerald-500">({log.details})</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-500 py-4 text-center">Belum ada aktivitas terdeteksi. Silakan lakukan operasi sistem...</div>
          )}
        </div>
      </div>
    </div>
  );
};
