import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  TrendingUp as GainIcon,
  PieChart as PieIcon,
  Coins,
  Building,
  DollarSign,
  Wallet,
  Calendar,
  Grid,
  List,
  Search,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { Investment, Account, AuthSession } from "../types.js";
import { formatRupiah } from "../utils/format.js";

interface InvestmentsViewProps {
  investments: Investment[];
  accounts: Account[];
  session: AuthSession;
  onCreateInvestment: (inv: any) => Promise<void>;
  onUpdateInvestment: (id: string, inv: any) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
  onRefreshPrices: () => Promise<void>;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  investments,
  accounts,
  session,
  onCreateInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  onRefreshPrices,
}) => {
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<"cards" | "table" | "charts">("cards");
  const [filterType, setFilterType] = useState<string>("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Aktif");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdatePriceModalOpen, setIsUpdatePriceModalOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);

  // Form States (Add Investment)
  const [name, setName] = useState("");
  const [type, setType] = useState("Saham");
  const [buyPrice, setBuyPrice] = useState("");
  const [shares, setShares] = useState("");
  const [initialCapital, setInitialCapital] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);

  // Form States (Update Unit Price)
  const [newCurrentPrice, setNewCurrentPrice] = useState("");

  // Last Refresh Time Persistence
  const [lastRefreshTime, setLastRefreshTime] = useState(() => {
    return localStorage.getItem("kitapunya_last_refresh_time") || "Belum pernah dikemas kini";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter selectable source accounts based on profile restrictions
  const profileAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Must match the active profile's database userId
      if (acc.userId !== session.id) return false;

      // Special Constraint: "Dana tidak boleh langsung diambil dari Rekening Jajan Berdua"
      if (session.fullName === "Uang Bersama") {
        const lowerName = acc.name.toLowerCase();
        if (lowerName.includes("jajan") || lowerName.includes("dua")) {
          return false;
        }
      }
      return true;
    });
  }, [accounts, session]);

  // Auto-fill or compute initial capital when buyPrice or shares change
  useEffect(() => {
    const price = Number(buyPrice) || 0;
    const unitCount = Number(shares) || 1;
    if (price > 0) {
      setInitialCapital(String(Math.round(price * unitCount)));
    }
  }, [buyPrice, shares]);

  // Handle price refresh trigger
  const handleRefreshPricesAI = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshPrices();
      const nowStr = new Date().toLocaleTimeString("ms-MY", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " (" + new Date().toLocaleDateString("ms-MY", { day: "numeric", month: "short" }) + ")";
      localStorage.setItem("kitapunya_last_refresh_time", nowStr);
      setLastRefreshTime(nowStr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open modals
  const handleOpenAdd = () => {
    setName("");
    setType("Saham");
    setBuyPrice("");
    setShares("");
    setInitialCapital("");
    setSourceAccountId(profileAccounts[0]?.id || "");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setIsAddModalOpen(true);
  };

  const handleOpenUpdatePrice = (inv: Investment) => {
    setSelectedInv(inv);
    setNewCurrentPrice(String(inv.currentPrice || inv.buyPrice));
    setIsUpdatePriceModalOpen(true);
  };

  // Create Investment Action
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) return;

    const bPrice = Number(buyPrice) || 0;
    const sharesNum = shares ? Number(shares) : null;
    const capital = Number(initialCapital) || (bPrice * (sharesNum || 1));

    await onCreateInvestment({
      name,
      type,
      buyPrice: bPrice,
      currentPrice: bPrice,
      currentValue: capital, // initially matching capital
      shares: sharesNum,
      initialCapital: capital,
      sourceAccountId: sourceAccountId || null,
      status: "Aktif",
      purchaseDate,
    });

    setIsAddModalOpen(false);
  };

  // Update Asset Unit Price
  const handleSubmitUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;

    const newPrice = Number(newCurrentPrice);
    if (isNaN(newPrice) || newPrice < 0) return;

    const sharesCount = selectedInv.shares || 1;
    const calculatedValue = Math.round(newPrice * sharesCount);

    await onUpdateInvestment(selectedInv.id, {
      currentPrice: newPrice,
      currentValue: calculatedValue,
    });

    setIsUpdatePriceModalOpen(false);
  };

  // Sell Investment Action (Refunding to account)
  const handleSellAsset = async (inv: Investment) => {
    const confirmation = window.confirm(
      `Apakah Anda yakin ingin menjual investasi "${inv.name}"?\n` +
      `Tindakan ini akan memperbarui status ke "Dijual" dan secara otomatis mengembalikan dana bernilai ${formatRupiah(inv.currentValue)} ke rekening sumber asal.`
    );
    if (!confirmation) return;

    await onUpdateInvestment(inv.id, {
      status: "Dijual",
    });
  };

  // Filter investments based on user settings
  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesType = filterType === "Semua" || inv.type === filterType;
      const matchesStatus = filterStatus === "Semua" || inv.status === filterStatus;
      const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            inv.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [investments, filterType, filterStatus, searchQuery]);

  // Overall calculations
  const {
    totalCapital,
    totalCurrentValue,
    totalGainLoss,
    roiPercent,
    totalProfitCount,
    totalLossCount,
    activeCount,
    soldCount,
  } = useMemo(() => {
    let capital = 0;
    let current = 0;
    let activeC = 0;
    let soldC = 0;
    let profitC = 0;
    let lossC = 0;

    investments.forEach((inv) => {
      if (inv.status === "Aktif") {
        capital += Number(inv.initialCapital) || 0;
        current += Number(inv.currentValue) || 0;
        activeC++;
        const diff = inv.currentValue - inv.initialCapital;
        if (diff > 0) profitC++;
        if (diff < 0) lossC++;
      } else {
        soldC++;
      }
    });

    const diff = current - capital;
    const roi = capital > 0 ? (diff / capital) * 100 : 0;

    return {
      totalCapital: capital,
      totalCurrentValue: current,
      totalGainLoss: diff,
      roiPercent: roi,
      totalProfitCount: profitC,
      totalLossCount: lossC,
      activeCount: activeC,
      soldCount: soldC,
    };
  }, [investments]);

  // Pie chart asset allocation calculations
  const chartData = useMemo(() => {
    const categoriesMap: { [key: string]: number } = {};
    investments
      .filter((inv) => inv.status === "Aktif")
      .forEach((inv) => {
        categoriesMap[inv.type] = (categoriesMap[inv.type] || 0) + Number(inv.currentValue);
      });

    return Object.keys(categoriesMap).map((key) => ({
      name: key,
      value: categoriesMap[key],
    }));
  }, [investments]);

  // Bar chart performance data
  const performanceData = useMemo(() => {
    return investments
      .filter((inv) => inv.status === "Aktif")
      .map((inv) => {
        const gainLoss = inv.currentValue - inv.initialCapital;
        return {
          name: inv.name.length > 15 ? inv.name.substring(0, 15) + "..." : inv.name,
          "Modal Awal": inv.initialCapital,
          "Nilai Saat Ini": inv.currentValue,
          "Untung/Rugi": gainLoss,
        };
      });
  }, [investments]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

  const formatDateStr = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("ms-MY", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Coins size={20} />
            </span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Pusat Investasi & Portofolio Pintar
            </h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mt-2 max-w-xl">
            Kelola investasi Emas, Saham, Reksadana, Obligasi, dan Simpanan secara terpisah untuk profil <span className="text-zinc-800 dark:text-zinc-200 font-bold">{session.fullName}</span>. Dana didebit dan dikembalikan langsung ke rekening pilihan Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} />
            Beli / Tambah Aset
          </button>
        </div>
      </div>

      {/* PRICE REFRESH AI BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500 animate-pulse" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
            Kemas Kini Harga Pasaran Terkini (AI Gemini)
          </span>
          <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold px-2 py-0.5 rounded-md ml-1">
            {lastRefreshTime}
          </span>
        </div>
        <button
          onClick={handleRefreshPricesAI}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Menilai Pasar..." : "Perbarui Harga (AI Gemini)"}
        </button>
      </div>

      {/* BENTO STATS WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capital */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Jumlah Modal Aktif (Cost)
          </span>
          <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-100">
            {formatRupiah(totalCapital)}
          </h3>
          <div className="text-[10px] text-zinc-400 font-semibold">
            Berdasarkan modal asal aset aktif
          </div>
          <div className="absolute right-4 bottom-4 text-zinc-200 dark:text-zinc-800 opacity-20">
            <Wallet size={40} />
          </div>
        </div>

        {/* Current Portfolio Value */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Nilai Portofolio Saat Ini (Pasar)
          </span>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalCurrentValue)}
          </h3>
          <div className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
            <CheckCircle size={10} className="text-emerald-500" />
            Terakhir diperbarui secara langsung
          </div>
          <div className="absolute right-4 bottom-4 text-emerald-100 dark:text-emerald-950 opacity-25">
            <Building size={40} />
          </div>
        </div>

        {/* Profit / Loss */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Keuntungan / Kerugian Semasa
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-xl font-black ${totalGainLoss >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {totalGainLoss >= 0 ? "+" : ""}
              {formatRupiah(totalGainLoss)}
            </h3>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${totalGainLoss >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
              {roiPercent >= 0 ? "+" : ""}
              {roiPercent.toFixed(2)}% ROI
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 font-semibold">
            {totalProfitCount} untung · {totalLossCount} rugi dari {activeCount} aset
          </div>
          <div className="absolute right-4 bottom-4 text-zinc-200 dark:text-zinc-800 opacity-20">
            {totalGainLoss >= 0 ? <ArrowUpRight size={40} /> : <ArrowDownLeft size={40} />}
          </div>
        </div>

        {/* Quick summary status info */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-5 rounded-3xl shadow-sm space-y-2 relative">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Ringkasan Transaksi Investasi
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-400 block font-semibold text-[10px]">ASET AKTIF</span>
              <span className="font-extrabold text-sm">{activeCount} instrumen</span>
            </div>
            <div>
              <span className="text-zinc-400 block font-semibold text-[10px]">SUDAH DIJUAL</span>
              <span className="font-extrabold text-sm text-amber-400">{soldCount} selesai</span>
            </div>
          </div>
          <div className="text-[9px] text-zinc-500 font-bold tracking-tight uppercase">
            PEMILIK: {session.fullName} (PORTFOLIO TERASING)
          </div>
        </div>
      </div>

      {/* DASHBOARD CHARTS TAB SELECTION */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("cards")}
          className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === "cards"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <Grid size={14} />
          Kad Portfolio ({filteredInvestments.length})
        </button>
        <button
          onClick={() => setActiveTab("table")}
          className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === "table"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <List size={14} />
          Daftar Tabel
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === "charts"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <PieIcon size={14} />
          Analisis Komposisi & Prestasi
        </button>
      </div>

      {/* FILTERS PANEL */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-zinc-400 uppercase">Jenis:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none text-zinc-700 dark:text-zinc-200 focus:border-emerald-500"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="Emas">Emas</option>
              <option value="Saham">Saham</option>
              <option value="Reksa Dana">Reksa Dana</option>
              <option value="Obligasi">Obligasi</option>
              <option value="Deposito">Deposito</option>
              <option value="Cryptocurrency">Cryptocurrency</option>
              <option value="Investasi Lainnya">Investasi Lainnya</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-zinc-400 uppercase">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 outline-none text-zinc-700 dark:text-zinc-200 focus:border-emerald-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Dijual">Dijual</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari investasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold outline-none focus:border-emerald-500 text-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* TAB CONTENT: CHARTS ANALYTICS */}
      {activeTab === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation Pie */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
                Komposisi Instrumen Investasi (Nilai Saat Ini)
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold">
                Persentase alokasi aset berdasarkan jenis investasi aktif
              </p>
            </div>
            <div className="h-64 relative flex items-center justify-center">
              {chartData.length > 0 ? (
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
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-zinc-400 font-semibold">
                  Tidak ada data investasi aktif untuk ditampilkan.
                </div>
              )}
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-wider">
                Modal Awal vs Nilai Pasar Saat Ini
              </h4>
              <p className="text-[10px] text-zinc-400 font-semibold">
                Bandingkan modal investasi dengan harga pasar terbaru
              </p>
            </div>
            <div className="h-64 flex items-center justify-center">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: "bold" }} />
                    <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                    <Bar dataKey="Modal Awal" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Nilai Saat Ini" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-zinc-400 font-semibold">
                  Tidak ada data investasi aktif untuk ditampilkan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CARDS PORTFOLIO VIEW */}
      {activeTab === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestments.map((inv) => {
            const isSold = inv.status === "Dijual";
            const profitLoss = inv.currentValue - inv.initialCapital;
            const returnPercent = inv.initialCapital > 0 ? (profitLoss / inv.initialCapital) * 100 : 0;
            const isProfit = profitLoss >= 0;

            return (
              <div
                key={inv.id}
                className={`bg-white dark:bg-zinc-900 border ${
                  isSold
                    ? "border-zinc-200 dark:border-zinc-800/50 opacity-70"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
                } rounded-3xl p-6 transition-all flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${
                      isSold
                        ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-850"
                        : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    }`}>
                      {inv.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isSold && (
                        <>
                          <button
                            onClick={() => handleOpenUpdatePrice(inv)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Perbarui Harga Per Unit"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <button
                            onClick={() => handleSellAsset(inv)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded text-amber-500 hover:text-amber-600 font-black text-[10px]"
                            title="Jual Aset"
                          >
                            Jual
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus investasi "${inv.name}"?`)) {
                            onDeleteInvestment(inv.id);
                          }
                        }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-zinc-400 hover:text-red-500"
                        title="Hapus Catatan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {inv.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDateStr(inv.purchaseDate)}
                      </span>
                      {inv.status === "Dijual" ? (
                        <span className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-extrabold px-1 rounded">
                          Selesai Dijual
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-600 font-extrabold px-1 rounded">
                          Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Initial capital vs Current value */}
                <div className="grid grid-cols-2 gap-4 border-y border-zinc-100 dark:border-zinc-800/80 py-3.5 my-4 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      Modal Dilabur
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mt-0.5">
                      {formatRupiah(inv.initialCapital)}
                    </span>
                    {inv.shares && (
                      <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">
                        {inv.shares} unit @ {formatRupiah(inv.buyPrice)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                      {isSold ? "Nilai Penjualan" : "Nilai Saat Ini"}
                    </span>
                    <span className={`font-black block mt-0.5 ${isSold ? "text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatRupiah(inv.currentValue)}
                    </span>
                    {!isSold && inv.shares && (
                      <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">
                        Harga: {formatRupiah(inv.currentPrice || inv.buyPrice)}/u
                      </span>
                    )}
                  </div>
                </div>

                {/* Profit/Loss details */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {isSold ? "Hasil Penjualan" : "Peratus Untung / Rugi"}
                  </span>
                  <div className={`flex items-center gap-1 font-black ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                    {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    <span>
                      {isProfit ? "+" : ""}
                      {returnPercent.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-400 ml-1">
                      ({isProfit ? "+" : ""}
                      {formatRupiah(profitLoss)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: TABLE DAFTAR VIEW */}
      {activeTab === "table" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-4">Aset & Instrumen</th>
                  <th className="p-4">Jenis</th>
                  <th className="p-4">Tanggal Beli</th>
                  <th className="p-4 text-right">Modal Diinvestasikan</th>
                  <th className="p-4 text-right">Harga Saat Ini/Unit</th>
                  <th className="p-4 text-right">Nilai Saat Ini</th>
                  <th className="p-4 text-right">Imbal Hasil (ROI)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredInvestments.map((inv) => {
                  const isSold = inv.status === "Dijual";
                  const profitLoss = inv.currentValue - inv.initialCapital;
                  const returnPercent = inv.initialCapital > 0 ? (profitLoss / inv.initialCapital) * 100 : 0;
                  const isProfit = profitLoss >= 0;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-850/40 transition-colors ${
                        isSold ? "opacity-60 text-zinc-400" : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <td className="p-4 font-extrabold">
                        <div>
                          <span>{inv.name}</span>
                          {inv.shares && (
                            <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                              {inv.shares} unit @ {formatRupiah(inv.buyPrice)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          {inv.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold">{formatDateStr(inv.purchaseDate)}</td>
                      <td className="p-4 text-right font-bold">{formatRupiah(inv.initialCapital)}</td>
                      <td className="p-4 text-right font-semibold">
                        {formatRupiah(inv.currentPrice || inv.buyPrice)}
                      </td>
                      <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(inv.currentValue)}
                      </td>
                      <td className={`p-4 text-right font-black ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                        <div className="flex flex-col items-end">
                          <span>
                            {isProfit ? "+" : ""}
                            {returnPercent.toFixed(1)}%
                          </span>
                          <span className="text-[9px] font-semibold text-zinc-400">
                            ({isProfit ? "+" : ""}
                            {formatRupiah(profitLoss)})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          isSold
                            ? "bg-zinc-100 text-zinc-500"
                            : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {!isSold && (
                            <>
                              <button
                                onClick={() => handleOpenUpdatePrice(inv)}
                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
                                title="Perbarui Harga"
                              >
                                <RefreshCw size={12} />
                              </button>
                              <button
                                onClick={() => handleSellAsset(inv)}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg"
                                title="Jual Investasi"
                              >
                                Jual
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus investasi "${inv.name}"?`)) {
                                onDeleteInvestment(inv.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-600 rounded-lg"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY PORTFOLIO ILLUSTRATION */}
      {filteredInvestments.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
          <AlertCircle size={48} className="text-zinc-300" />
          <h3 className="font-extrabold text-sm text-zinc-700 dark:text-zinc-300">
            Tidak Ada Data Investasi Ditemukan
          </h3>
          <p className="text-xs text-zinc-400 font-semibold max-w-sm">
            Mulai lacak investasi Anda dengan menekan tombol "Beli / Tambah Aset" di atas untuk mempercepat pencapaian tujuan keuangan Anda!
          </p>
        </div>
      )}

      {/* MODAL: BUY / ADD NEW INVESTMENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Coins size={18} />
              </span>
              <h3 className="font-black text-lg text-zinc-900 dark:text-zinc-50">
                Pendaftaran & Pembelian Investasi Baru
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-6 font-semibold">
              Silakan masukkan rincian lengkap instrumen investasi aktif Anda. Dana investasi akan dicatat dan dikurangi secara otomatis dari saldo rekening pilihan Anda.
            </p>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Nama Aset / Saham
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Logam Mulia Antam 10g, BBRI, dll."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jenis Investasi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="Emas">Emas</option>
                    <option value="Saham">Saham</option>
                    <option value="Reksa Dana">Reksa Dana</option>
                    <option value="Obligasi">Obligasi</option>
                    <option value="Deposito">Deposito</option>
                    <option value="Cryptocurrency">Cryptocurrency</option>
                    <option value="Investasi Lainnya">Investasi Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Harga Beli Seunit (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 1400000"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Jumlah Unit (Shares)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Contoh: 10, 0.5, dll."
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Modal Asal (Computed)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Modal asal dilabur"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold bg-zinc-50 dark:bg-zinc-900/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Rekening Sumber Dana (Ref)
                  </label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  >
                    <option value="">-- Tanpa Hubungan Rekening (Tanpa Potongan) --</option>
                    {profileAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] text-zinc-400 font-bold block mt-1">
                    *Membeli aset akan secara otomatis mengurangi saldo rekening di atas dengan mencatat Transaksi Pengeluaran (Kategori: Investasi & Tabungan).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                    Tarikh Pembelian
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Strict validation alert regarding Uang Bersama - Jajan Berdua account */}
              {session.fullName === "Uang Bersama" && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-bold flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    PERINGATAN: Berdasarkan kesepakatan bersama, rekening "Jajan Berdua" tidak dicantumkan dan dilarang untuk dijadikan dana investasi. Hanya rekening "Tabungan Bersama" yang diperbolehkan.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm"
                >
                  Konfirmasi & Kurangi Saldo Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE CURRENT UNIT PRICE */}
      {isUpdatePriceModalOpen && selectedInv && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex items-center gap-1.5 mb-1">
              <RefreshCw size={18} className="text-emerald-600 animate-spin" />
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                Perbarui Harga Per Unit Terkini
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 font-semibold">
              Aset: <span className="font-black text-zinc-800 dark:text-zinc-200">{selectedInv.name}</span>
            </p>

            <form onSubmit={handleSubmitUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-1.5">
                  Harga Per Unit Baru (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newCurrentPrice}
                  onChange={(e) => setNewCurrentPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-50 text-xs focus:border-emerald-600 outline-none font-semibold"
                />
              </div>

              {selectedInv.shares && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold space-y-1">
                  <div className="flex justify-between">
                    <span>Jumlah Unit:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedInv.shares} u</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nilai Investasi Baru:</span>
                    <span className="font-black text-emerald-600">
                      {formatRupiah((Number(newCurrentPrice) || 0) * selectedInv.shares)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUpdatePriceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm"
                >
                  Konfirmasi Pembaruan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
