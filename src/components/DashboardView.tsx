import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  PlusCircle,
  Calendar,
  AlertCircle,
  Camera,
  Target
} from "lucide-react";
import { Account, Transaction, Category, Investment } from "../types.js";
import { formatRupiah, formatDate } from "../utils/format.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  setView: (view: string) => void;
  openAddTxModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  categories,
  investments,
  setView,
  openAddTxModal,
}) => {
  // --- METRIC CALCULATIONS ---
  const {
    totalBalance,
    totalIncome,
    totalExpense,
    totalInvestments,
    totalNetWorth,
    totalInvestmentGainLoss
  } = useMemo(() => {
    const bal = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    const inc = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const exp = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const activeInvs = (investments || []).filter(i => i.status === "Aktif");
    const activeInvsVal = activeInvs.reduce((sum, inv) => sum + (Number(inv.currentValue) || 0), 0);
    const activeInvsCost = activeInvs.reduce((sum, inv) => sum + (Number(inv.initialCapital) || 0), 0);
    const invGain = activeInvsVal - activeInvsCost;

    return {
      totalBalance: bal,
      totalIncome: inc,
      totalExpense: exp,
      totalInvestments: activeInvsVal,
      totalNetWorth: bal + activeInvsVal,
      totalInvestmentGainLoss: invGain
    };
  }, [accounts, transactions, investments]);

  const lastRefreshTime = useMemo(() => {
    return localStorage.getItem("kitapunya_last_refresh_time") || "Belum pernah dikemas kini";
  }, [investments]);

  // --- RECHARTS MONTHLY DATA ---
  const monthlyChartData = useMemo(() => {
    const monthsMap: Record<string, { month: string; Pemasukan: number; Pengeluaran: number }> = {};

    // Get transactions from last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
      const key = d.toISOString().substring(0, 7); // YYYY-MM
      monthsMap[key] = { month: label, Pemasukan: 0, Pengeluaran: 0 };
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const key = txDate.toISOString().substring(0, 7);
      if (monthsMap[key]) {
        if (tx.type === "income") {
          monthsMap[key].Pemasukan += tx.amount;
        } else if (tx.type === "expense") {
          monthsMap[key].Pengeluaran += tx.amount;
        }
      }
    });

    return Object.values(monthsMap);
  }, [transactions]);

  // --- RECHARTS CATEGORY DATA ---
  const categoryChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};

    transactions
      .filter((t) => t.type === "expense")
      .forEach((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catName = cat ? cat.name : "Lain-lain";
        const catColor = cat ? cat.color : "#9CA3AF";

        if (!map[catName]) {
          map[catName] = { name: catName, value: 0, color: catColor };
        }
        map[catName].value += tx.amount;
      });

    return Object.values(map);
  }, [transactions, categories]);

  // --- RECHARTS INVESTMENT PERFORMANCE DATA ---
  const investmentChartData = useMemo(() => {
    const activeInvs = (investments || []).filter((i) => i.status === "Aktif");
    if (activeInvs.length === 0) {
      return [];
    }
    return activeInvs.map((inv) => ({
      name: inv.name.length > 12 ? inv.name.substring(0, 10) + "..." : inv.name,
      "Modal": Number(inv.initialCapital) || 0,
      "Nilai Semasa": Number(inv.currentValue) || 0,
    }));
  }, [investments]);

  // Latest 5 Transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Upper Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 dark:from-emerald-950 dark:to-emerald-900 text-white p-6 rounded-3xl shadow-xl shadow-emerald-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Selamat Datang di KitaPunya
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm font-medium mt-1 max-w-xl">
            Urus kewangan anda secara pintar, moden dan automatik menggunakan teknologi AI Gemini.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Action 1: Tambah Transaksi */}
        <button
          onClick={() => setView("transactions")}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <PlusCircle size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Tambah Transaksi</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Catat baki perbelanjaan</p>
          </div>
        </button>

        {/* Action 2: Scan Struk */}
        <button
          onClick={() => setView("gallery")}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Camera size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Scan Struk AI</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Ekstrak automatik Gemini</p>
          </div>
        </button>

        {/* Action 3: Transfer */}
        <button
          onClick={() => setView("accounts")}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ArrowRight size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Pindahan Dana</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Transfer antara akaun</p>
          </div>
        </button>

        {/* Action 4: Target Tabungan */}
        <button
          onClick={() => setView("savings")}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
        >
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Target size={20} />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Target Tabungan</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Pantau sasaran simpanan</p>
          </div>
        </button>
      </div>

      {/* Primary Financial Metric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Kekayaan (Net Worth Card) */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-zinc-800 md:col-span-2 lg:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Jumlah Kekayaan Bersih (Net Worth)
              </span>
              <h3 className="text-3xl font-black mt-1 text-white">
                {formatRupiah(totalNetWorth)}
              </h3>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Kemaskini Harga AI Terakhir
              </span>
              <span className="text-xs font-black text-emerald-400 mt-1 block">
                {lastRefreshTime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[9px] block">Saldo Tunai</span>
              <span className="font-extrabold text-sm text-zinc-200">{formatRupiah(totalBalance)}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[9px] block">Nilai Pelaburan</span>
              <span className="font-extrabold text-sm text-emerald-400">{formatRupiah(totalInvestments)}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[9px] block">Untung/Rugi Pelaburan</span>
              <span className={`font-extrabold text-sm ${totalInvestmentGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {totalInvestmentGainLoss >= 0 ? "+" : ""}
                {formatRupiah(totalInvestmentGainLoss)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase text-[9px] block">Status Portfolio</span>
              <span className="font-extrabold text-sm text-zinc-300">Terasing & Selamat</span>
            </div>
          </div>
        </div>

        {/* Total Saldo Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Baki Tunai Tersedia
            </span>
            <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-1">
              {formatRupiah(totalBalance)}
            </h3>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Total Pemasukan Tunai
            </span>
            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(totalIncome)}
            </h3>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
          <div className="p-4 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Total Pengeluaran Tunai
            </span>
            <h3 className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-1">
              {formatRupiah(totalExpense)}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Section - Row 1 (Cash Flow & Investment Growth) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600 animate-pulse" />
              Aliran Tunai Bulanan (6 Bulan)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                <XAxis dataKey="month" stroke="#A1A1AA" tickLine={false} style={{ fontSize: "12px", fontFamily: "sans-serif" }} />
                <YAxis stroke="#A1A1AA" tickLine={false} style={{ fontSize: "12px", fontFamily: "sans-serif" }} />
                <Tooltip
                  formatter={(val: number) => formatRupiah(val)}
                  contentStyle={{
                    borderRadius: "16px",
                    background: "#fff",
                    border: "1px solid #E4E4E7",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="Pemasukan" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investment Growth Chart (Grafik Perkembangan Investasi) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              Grafik Perkembangan Investasi (Modal vs Nilai Semasa)
            </h3>
          </div>
          <div className="h-72 w-full">
            {investmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="name" stroke="#A1A1AA" tickLine={false} style={{ fontSize: "11px", fontFamily: "sans-serif" }} />
                  <YAxis stroke="#A1A1AA" tickLine={false} style={{ fontSize: "11px", fontFamily: "sans-serif" }} />
                  <Tooltip
                    formatter={(val: number) => formatRupiah(val)}
                    contentStyle={{
                      borderRadius: "16px",
                      background: "#fff",
                      border: "1px solid #E4E4E7",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="Modal" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Nilai Semasa" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 gap-2 py-12">
                <AlertCircle size={32} />
                <span className="text-xs">Tiada pelaburan aktif ditemui untuk profil ini</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section - Row 2 (Pie Chart & Asset Allocation Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Category Pie Chart (1/3 width) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-4">
            Perbelanjaan Mengikut Kategori
          </h3>
          <div className="h-56 w-full flex-1 relative">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatRupiah(val)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 gap-2">
                <AlertCircle size={32} />
                <span className="text-xs">Tiada data perbelanjaan dicatatkan</span>
              </div>
            )}
          </div>
          {categoryChartData.length > 0 && (
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-32">
              {categoryChartData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate max-w-36">{cat.name}</span>
                  </div>
                  <span>{formatRupiah(cat.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Asset Allocation Bento (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
              <Target size={18} className="text-emerald-600" />
              Saranan Agihan Aset Pintar
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
              Berdasarkan teori pengurusan portfolio, agihan yang seimbang antara tunai cecair (60%) dan pelaburan pertumbuhan (40%) dapat memaksimumkan pulangan sambil meminimumkan risiko. Gunakan AI Scanner untuk merekod perbelanjaan harian secara pantas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Kecairan Tunai</span>
              <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                {totalNetWorth > 0 ? ((totalBalance / totalNetWorth) * 100).toFixed(1) : 0}%
              </span>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? (totalBalance / totalNetWorth) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Kekuatan Pelaburan</span>
              <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                {totalNetWorth > 0 ? ((totalInvestments / totalNetWorth) * 100).toFixed(1) : 0}%
              </span>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalNetWorth > 0 ? (totalInvestments / totalNetWorth) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Transaksi Terakhir
          </h3>
          <button
            id="dash-view-all-txs"
            onClick={() => setView("transactions")}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Lihat Semua
            <ArrowRight size={14} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Tarikh & Keterangan</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Akaun</th>
                  <th className="pb-3 text-right pr-2">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const isExpense = tx.type === "expense";
                  const isIncome = tx.type === "income";

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-sm font-semibold transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {tx.description || "Tanpa Keterangan"}
                        </div>
                        <div className="text-xs text-zinc-400 font-medium">
                          {formatDate(tx.date)}
                        </div>
                      </td>
                      <td className="py-3.5">
                        {cat ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-medium">Pindahan</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
                          {acc?.name || "Akaun Luar"}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right pr-2 font-extrabold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : isExpense ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"}`}>
                        {isIncome ? "+" : isExpense ? "-" : ""}
                        {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400 dark:text-zinc-600 gap-2">
            <AlertCircle size={36} />
            <span className="text-xs">Tiada rekod transaksi ditemui. Mula catatkan perbelanjaan anda!</span>
          </div>
        )}
      </div>
    </div>
  );
};
