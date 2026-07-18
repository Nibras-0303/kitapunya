import React, { useMemo, useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  PlusCircle,
  Calendar,
  AlertCircle,
  Camera,
  Target,
  Users,
  User,
  Sparkles,
  Wallet,
  Activity,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Account, Transaction, Category, Investment, AuthSession } from "../types.js";
import { formatRupiah, formatDate } from "../utils/format.js";
import { api } from "../services/api.js";
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
  session?: AuthSession | null;
  savingsGoals?: any[];
  onCreateTransaction?: (tx: any) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  categories,
  investments,
  setView,
  openAddTxModal,
  session,
  savingsGoals = [],
  onCreateTransaction
}) => {
  const isJoint = session?.fullName === "Uang Bersama";
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Quick Add Manual Transaction Form States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickType, setQuickType] = useState<"income" | "expense">("expense");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickAccountId, setQuickAccountId] = useState("");
  const [quickDate, setQuickDate] = useState(new Date().toISOString().substring(0, 10));
  const [quickDescription, setQuickDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local Accounts States for Quick Add
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [errorAccounts, setErrorAccounts] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    setErrorAccounts(null);
    try {
      const response = await api.getAccounts();
      setLocalAccounts(response);
      if (response && response.length > 0) {
        setQuickAccountId(response[0].id);
      }
    } catch (err) {
      console.error("Failed to load accounts in Quick Add:", err);
      setErrorAccounts("Tidak dapat memuat rekening.");
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (isQuickAddOpen) {
      loadAccounts();
    }
  }, [isQuickAddOpen]);

  // Set default category when quickType or categories change
  useEffect(() => {
    const filteredCats = categories.filter(c => c.type === quickType);
    if (filteredCats.length > 0) {
      setQuickCategoryId(filteredCats[0].id);
    } else {
      setQuickCategoryId("");
    }
  }, [categories, quickType]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === quickType);
  }, [categories, quickType]);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    const amountNum = Number(quickAmount);
    if (!quickAmount || isNaN(amountNum) || amountNum <= 0) {
      setFormError("Nominal harus berupa angka positif.");
      return;
    }

    if (!quickAccountId) {
      setFormError("Rekening harus dipilih.");
      return;
    }

    if (!quickCategoryId) {
      setFormError("Kategori harus dipilih.");
      return;
    }

    setIsSubmitting(true);
    try {
      const txPayload = {
        accountId: quickAccountId,
        toAccountId: null,
        categoryId: quickCategoryId,
        amount: amountNum,
        type: quickType,
        description: quickDescription || `Manual ${quickType === "income" ? "Pemasukan" : "Pengeluaran"}`,
        date: quickDate,
        receiptImageUrl: null,
      };

      if (onCreateTransaction) {
        await onCreateTransaction(txPayload);
      } else {
        await api.createTransaction(txPayload);
      }

      setSuccessMsg("Transaksi berhasil disimpan secara manual!");
      setQuickAmount("");
      setQuickDescription("");
      // keep date, type, account, category as they are or reset to defaults
      const filteredCats = categories.filter(c => c.type === quickType);
      if (filteredCats.length > 0) {
        setQuickCategoryId(filteredCats[0].id);
      }
      setTimeout(() => {
        setIsQuickAddOpen(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch report data if in joint mode
  useEffect(() => {
    if (isJoint) {
      setLoadingReport(true);
      api.getPartnerReport()
        .then(data => {
          setReportData(data);
        })
        .catch(err => {
          console.error("Gagal mengambil laporan pasangan:", err);
        })
        .finally(() => {
          setLoadingReport(false);
        });
    }
  }, [isJoint, transactions, accounts]);

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

  // Compute joint wealth aggregate
  const jointWealth = useMemo(() => {
    if (!isJoint || !reportData) return totalBalance;
    return (
      reportData.nibras.balance +
      reportData.zenita.balance +
      reportData.bersama.tabunganBalance +
      reportData.bersama.operasionalBalance
    );
  }, [isJoint, reportData, totalBalance]);

  // Calculate Nibras and Zenita transfer contributions to Joint
  const { nibrasContribution, zenitaContribution } = useMemo(() => {
    let nibCont = 0;
    let zenCont = 0;

    transactions.forEach(tx => {
      if (tx.type === "income") {
        const desc = (tx.description || "").toLowerCase();
        if (desc.includes("nibras")) {
          nibCont += tx.amount;
        } else if (desc.includes("zenita")) {
          zenCont += tx.amount;
        }
      }
    });

    return { nibrasContribution: nibCont, zenitaContribution: zenCont };
  }, [transactions]);

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

  // Latest 5 Transactions
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Upper Welcome Banner */}
      <div className={`bg-gradient-to-r ${isJoint ? "from-emerald-750 to-teal-650 dark:from-emerald-950 dark:to-teal-950" : "from-blue-700 to-indigo-600 dark:from-blue-950 dark:to-indigo-950"} text-white p-6 rounded-3xl shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 animate-pulse" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              {isJoint ? (
                <>
                  <Users size={22} className="text-emerald-350" />
                  Hub Kewangan Bersama Pasangan 💖
                </>
              ) : (
                <>
                  <User size={22} className="text-blue-300" />
                  Saku Peribadi {session?.fullName} 👤
                </>
              )}
            </h2>
            <p className="text-white/80 text-xs md:text-sm font-medium mt-1.5 max-w-xl">
              {isJoint
                ? "Pantau seluruh kekayaan isi rumah, prestasi simpanan bersama, serta kontribusi aktif anda dan pasangan secara automatik."
                : `Urus baki simpanan peribadi, jajan peribadi, bajet bulanan, dan target tabungan anda secara terlindung.`}
            </p>
          </div>
          {isJoint && (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex flex-col items-end">
              <span className="text-[10px] text-white/75 font-bold uppercase tracking-wider">Status Sambungan</span>
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Nibras & Zenita Terhubung
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Action 1: Tambah Transaksi */}
          <button
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className={`flex flex-col md:flex-row items-center gap-3 p-4 bg-white dark:bg-zinc-900 border rounded-3xl shadow-sm transition-all text-left cursor-pointer group ${
              isQuickAddOpen 
                ? "border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50/10 dark:bg-emerald-950/5" 
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className={`p-2.5 rounded-2xl group-hover:scale-110 transition-transform ${isQuickAddOpen ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"}`}>
              <PlusCircle size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Tambah Transaksi</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{isQuickAddOpen ? "Tutup Form" : "Catat manual cepat"}</p>
            </div>
          </button>

          {/* Action 2: Scan Struk */}
          <button
            onClick={() => setView("scan")}
            className="flex flex-col md:flex-row items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
          >
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Camera size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">Scan Struk AI</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Ekstrak resit pintar</p>
            </div>
          </button>

          {/* Action 3: Target Tabungan */}
          <button
            onClick={() => setView("savings")}
            className="flex flex-col md:flex-row items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all text-left cursor-pointer group"
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

        {/* Quick Add Form Section */}
        {isQuickAddOpen && (
          <div className="bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Tambah Transaksi Manual
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Isi detail di bawah untuk merekodkan transaksi secara langsung.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-xs font-bold"
              >
                Tutup
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={14} />
                {formError}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              {/* Jenis: Pemasukan / Pengeluaran */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setQuickType("expense")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                      quickType === "expense"
                        ? "border-red-500 bg-red-50/20 text-red-600 dark:text-red-400 font-black ring-2 ring-red-500/10"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full bg-red-500 ${quickType === "expense" ? "scale-110" : "opacity-60"}`} />
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickType("income")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                      quickType === "income"
                        ? "border-emerald-500 bg-emerald-50/20 text-emerald-600 dark:text-emerald-400 font-black ring-2 ring-emerald-500/10"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 ${quickType === "income" ? "scale-110" : "opacity-60"}`} />
                    Pemasukan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nominal * */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Nominal (Rupiah) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">Rp</span>
                    <input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-bold outline-none text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-bold outline-none text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kategori * */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kategori *
                  </label>
                  <select
                    value={quickCategoryId}
                    onChange={(e) => setQuickCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-bold outline-none text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  >
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <option value="">-- Tanpa Kategori --</option>
                    )}
                  </select>
                </div>

                {/* Rekening * */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    {quickType === "expense" ? "Rekening Sumber (Keluar Dari) *" : "Rekening Penerima (Masuk Ke) *"}
                  </label>
                  {loadingAccounts ? (
                    <div className="text-xs font-semibold text-zinc-500 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl px-4 animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                      Memuat daftar rekening...
                    </div>
                  ) : errorAccounts ? (
                    <div className="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl">
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {errorAccounts}
                      </span>
                      <button
                        type="button"
                        onClick={loadAccounts}
                        className="self-start px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded-lg transition-all"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  ) : (
                    <select
                      value={quickAccountId}
                      onChange={(e) => setQuickAccountId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-bold outline-none text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                      required
                    >
                      {localAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatRupiah(a.balance)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Keterangan (Opsional) */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan transaksi..."
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl text-xs font-bold outline-none text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-extrabold text-zinc-500 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm hover:shadow-emerald-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Simpan Transaksi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Primary Financial Metric Bento Grid */}
      {isJoint ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Wealth Aggregate Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl relative overflow-hidden shadow-md flex items-center gap-5 col-span-1 md:col-span-3 lg:col-span-1">
            <div className="p-4 bg-white/10 rounded-2xl">
              <Sparkles size={24} className="text-amber-300" />
            </div>
            <div>
              <span className="text-xs text-emerald-150 font-bold uppercase tracking-wider">
                Total Wealth Pasangan (Gabungan)
              </span>
              <h3 className="text-2xl font-black mt-1">
                {formatRupiah(jointWealth)}
              </h3>
              <p className="text-[10px] text-emerald-100 font-medium mt-1">
                {reportData ? `Termasuk simpanan peribadi Nibras & Zenita` : `Mengira nilai tunai...`}
              </p>
            </div>
          </div>

          {/* Operasional Bersama */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Wallet size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Operasional Bersama
              </span>
              <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-1">
                {formatRupiah(reportData?.bersama.operasionalBalance ?? 0)}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">SeaBank (Harian & Belanja)</p>
            </div>
          </div>

          {/* Tabungan Bersama */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Target size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Tabungan Bersama
              </span>
              <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-1">
                {formatRupiah(reportData?.bersama.tabunganBalance ?? 0)}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">SeaBank (Sasaran Simpanan)</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Saldo Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Baki Saku Peribadi
              </span>
              <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 mt-1">
                {formatRupiah(totalBalance)}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">Simpanan terisolasi milik anda</p>
            </div>
          </div>

          {/* Total Pemasukan */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Pemasukan Bulan Ini
              </span>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(totalIncome)}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">Gaji, Bonus & Freelance</p>
            </div>
          </div>

          {/* Total Pengeluaran */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl relative overflow-hidden shadow-sm flex items-center gap-5">
            <div className="p-4 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                Pengeluaran Bulan Ini
              </span>
              <h3 className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                {formatRupiah(totalExpense)}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1">Jajan, Makan & Hiburan</p>
            </div>
          </div>
        </div>
      )}

      {/* Joint Specific Section: Contributions & Savings Target Status */}
      {isJoint && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Individual Contributions Comparison Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <Activity size={16} className="text-emerald-500" />
                Kontribusi Simpanan Pasangan (Bulan Ini)
              </h3>
              <p className="text-xs text-zinc-400 font-medium mb-6">
                Pantau peratusan kontribusi pemindahan dari profil saku peribadi Nibras dan Zenita ke dalam Uang Bersama.
              </p>

              <div className="space-y-5">
                {/* Nibras Bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    <span>Nibras 👤</span>
                    <span>{formatRupiah(nibrasContribution)}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          nibrasContribution + zenitaContribution > 0
                            ? (nibrasContribution / (nibrasContribution + zenitaContribution)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Zenita Bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    <span>Zenita 👩‍🦰</span>
                    <span>{formatRupiah(zenitaContribution)}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-pink-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          nibrasContribution + zenitaContribution > 0
                            ? (zenitaContribution / (nibrasContribution + zenitaContribution)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 font-medium flex justify-between">
              <span>Total Kontribusi Terkumpul</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatRupiah(nibrasContribution + zenitaContribution)}</span>
            </div>
          </div>

          {/* Joint Savings Target Progress Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <Target size={16} className="text-purple-500" />
                Progress Target Tabungan Bersama
              </h3>
              <p className="text-xs text-zinc-400 font-medium mb-6">
                Matlamat simpanan yang dibina di bawah profil Uang Bersama untuk merancang masa depan.
              </p>

              {savingsGoals && savingsGoals.length > 0 ? (
                <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                  {savingsGoals.slice(0, 2).map((goal, index) => {
                    const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                    return (
                      <div key={goal.id || index} className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex justify-between items-center text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                          <span>{goal.name}</span>
                          <span className="text-purple-600 dark:text-purple-400">{percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-2">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                          <span>{formatRupiah(goal.currentAmount)} terkumpul</span>
                          <span>Sasaran {formatRupiah(goal.targetAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-zinc-400 dark:text-zinc-600 gap-1.5">
                  <Target size={28} className="text-zinc-300 dark:text-zinc-700" />
                  <span className="text-xs font-bold">Belum ada sasaran tabungan bersama</span>
                  <button
                    onClick={() => setView("savings")}
                    className="text-[10px] text-purple-600 dark:text-purple-400 font-black tracking-wider uppercase mt-1 cursor-pointer"
                  >
                    Cipta Sasaran
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 font-medium">
              *Simpanan bertambah automatik setiap kali Nibras/Zenita memindahkan baki ke Tabungan Bersama.
            </div>
          </div>
        </div>
      )}

      {/* Charts Section - Cash Flow & Category Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar size={18} className={`${isJoint ? "text-emerald-600" : "text-blue-500"} animate-pulse`} />
              {isJoint ? "Aliran Tunai Uang Bersama (6 Bulan)" : "Aliran Tunai Saku Peribadi (6 Bulan)"}
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
                <Bar dataKey="Pemasukan" fill={isJoint ? "#10B981" : "#3B82F6"} radius={[6, 6, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Chart (1/3 width) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-4">
              Perbelanjaan Mengikut Kategori
            </h3>
            <div className="h-56 w-full relative">
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
                  <span className="text-xs font-semibold">Tiada data perbelanjaan dicatatkan</span>
                </div>
              )}
            </div>
          </div>
          {categoryChartData.length > 0 && (
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-32">
              {categoryChartData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate max-w-32">{cat.name}</span>
                  </div>
                  <span>{formatRupiah(cat.value)}</span>
                </div>
              ))}
            </div>
          )}
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
