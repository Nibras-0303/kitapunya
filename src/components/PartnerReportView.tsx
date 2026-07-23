import React, { useState, useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Heart, 
  Activity, 
  AlertCircle,
  Loader2,
  Calendar,
  Wallet,
  Trash2,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api.js";
import { formatRupiah } from "../utils/format.js";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

interface PartnerReportViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const PartnerReportView: React.FC<PartnerReportViewProps> = ({ showToast }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = () => {
    setLoading(true);
    api.getPartnerReport()
      .then(data => {
        setReport(data);
      })
      .catch(err => {
        showToast("Gagal memuat laporan keuangan: " + err.message, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadReport();
  }, [showToast]);

  const handleResetData = async () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan seluruh laporan dan data keuangan test? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        setLoading(true);
        await api.resetData();
        showToast("Semua data laporan keuangan berhasil dikosongkan!", "success");
        loadReport();
      } catch (err: any) {
        showToast("Gagal mengosongkan data: " + err.message, "error");
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400 gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
        <span className="text-sm font-bold">Menganalisis data kewangan keluarga...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
        <AlertCircle size={36} />
        <span className="text-sm">Gagal memproses data laporan. Sila cuba seketika lagi.</span>
      </div>
    );
  }

  const combinedNetWorth = 
    report.nibras.balance + 
    report.zenita.balance + 
    report.bersama.tabunganBalance + 
    report.bersama.operasionalBalance;

  // Pie chart data for wealth distribution
  const wealthDistributionData = [
    { name: "Saku Nibras", value: report.nibras.balance, color: "#3B82F6" },
    { name: "Saku Zenita", value: report.zenita.balance, color: "#EC4899" },
    { name: "Joint Tabungan", value: report.bersama.tabunganBalance, color: "#6366F1" },
    { name: "Joint Operasional", value: report.bersama.operasionalBalance, color: "#10B981" }
  ].filter(item => item.value > 0);

  // Bar chart data for profile-by-profile cashflow comparison
  const comparisonData = [
    {
      name: "Nibras 👤",
      Pemasukan: report.nibras.income,
      Pengeluaran: report.nibras.expense,
    },
    {
      name: "Zenita 👩‍🦰",
      Pemasukan: report.zenita.income,
      Pengeluaran: report.zenita.expense,
    },
    {
      name: "Uang Bersama 💖",
      Pemasukan: report.bersama.transferIn,
      Pengeluaran: report.bersama.expense,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Laporan Keuangan Pasangan KitaPunya
              <Heart size={16} className="text-pink-500 fill-pink-500 animate-bounce" />
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Ringkasan gabungan saku pribadi dan rekening bersama secara transparan, aman, dan real-time.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetData}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/50 cursor-pointer self-start md:self-auto"
        >
          <Trash2 size={16} />
          <span>Kosongkan Data Keuangan</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs text-emerald-150 font-bold uppercase tracking-wider">Kekayaan Gabungan (Total Net Worth)</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mt-1">
            {formatRupiah(combinedNetWorth)}
          </h2>
          <p className="text-xs text-emerald-100 font-medium mt-2 max-w-lg">
            Menggabungkan saldo dari rekening pribadi Nibras, rekening pribadi Zenita, serta seluruh saldo rekening Uang Bersama di SeaBank.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <span className="text-[10px] text-white/75 font-bold uppercase tracking-wider block">Saldo Pribadi</span>
            <span className="text-sm font-black text-white">{formatRupiah(report.nibras.balance + report.zenita.balance)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <span className="text-[10px] text-white/75 font-bold uppercase tracking-wider block">Saldo Rekening Bersama</span>
            <span className="text-sm font-black text-white">{formatRupiah(report.bersama.tabunganBalance + report.bersama.operasionalBalance)}</span>
          </div>
        </div>
      </div>

      {/* Three Profiles Side-by-Side Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nibras Report Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Profil Nibras 👤
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Saldo Dompet Pribadi</span>
                <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">{formatRupiah(report.nibras.balance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Pemasukan</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(report.nibras.income)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Pengeluaran</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatRupiah(report.nibras.expense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zenita Report Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Profil Zenita 👩‍🦰
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Saldo Dompet Pribadi</span>
                <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">{formatRupiah(report.zenita.balance)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Pemasukan</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(report.zenita.income)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Pengeluaran</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatRupiah(report.zenita.expense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Joint Report Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                Profil Bersama 💖
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Saldo Rekening Bersama</span>
                <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">
                  {formatRupiah(report.bersama.tabunganBalance + report.bersama.operasionalBalance)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Transfer Masuk</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(report.bersama.transferIn)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Shared Expense</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatRupiah(report.bersama.expense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Cashflow Comparison & Wealth Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile-by-Profile Cashflow Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-emerald-600" />
            Perbandingan Aliran Tunai Mengikut Profil (Sejarah)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                <XAxis dataKey="name" stroke="#A1A1AA" tickLine={false} style={{ fontSize: "12px" }} />
                <YAxis stroke="#A1A1AA" tickLine={false} style={{ fontSize: "12px" }} />
                <Tooltip formatter={(val: number) => formatRupiah(val)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wealth Distribution Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-4">
              Agihan Kekayaan Hub Keluarga
            </h3>
            <div className="h-56 w-full relative">
              {wealthDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wealthDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {wealthDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatRupiah(val)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2">
                  <AlertCircle size={32} />
                  <span className="text-xs font-semibold">Tidak ada saldo terdeteksi</span>
                </div>
              )}
            </div>
          </div>
          {wealthDistributionData.length > 0 && (
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-32">
              {wealthDistributionData.map((w, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="truncate max-w-32">{w.name}</span>
                  </div>
                  <span>{formatRupiah(w.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
