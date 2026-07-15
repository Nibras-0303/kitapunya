import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar.jsx";
import { AuthView } from "./components/AuthView.jsx";
import { DashboardView } from "./components/DashboardView.jsx";
import { AccountsView } from "./components/AccountsView.jsx";
import { TransactionsView } from "./components/TransactionsView.jsx";
import { CategoriesView } from "./components/CategoriesView.jsx";
import { BudgetsView } from "./components/BudgetsView.jsx";
import { SavingsView } from "./components/SavingsView.jsx";
import { InvestmentsView } from "./components/InvestmentsView.jsx";
import { GalleryView } from "./components/GalleryView.jsx";
import { AdminView } from "./components/AdminView.jsx";

import { api } from "./services/api.js";
import {
  AuthSession,
  Account,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  Investment,
  ActivityLog
} from "./types.js";
import { 
  Bell, 
  Loader2, 
  Sparkles, 
  LayoutDashboard, 
  ArrowUpDown, 
  Camera, 
  Target, 
  Menu, 
  ArrowLeftRight, 
  UserMinus, 
  User, 
  Users, 
  CreditCard, 
  TrendingUp, 
  PieChart, 
  Tag, 
  History, 
  Moon, 
  Sun, 
  ArrowLeft,
  Image
} from "lucide-react";

export default function App() {
  // --- LAYOUT & THEME STATE ---
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const local = localStorage.getItem("theme");
    return local === "dark" ? "dark" : "light";
  });

  const [currentView, setView] = useState("dashboard");
  const [session, setSession] = useState<AuthSession | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kitapunya_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // --- DATA STATES ---
  const [autoOpenOcr, setAutoOpenOcr] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // --- TOAST NOTIFICATION STATE ---
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // Dismiss toast after delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- APPLY THEME CLASS ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // --- FETCH ALL APPLICATION DATA ---
  const fetchAllData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [accs, cats, txs, bdgts, goals, invs, activityLogs] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(),
        api.getSavingsGoals(),
        api.getInvestments(),
        session.role === "admin" ? api.getAdminLogs() : Promise.resolve([])
      ]);

      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBudgets(bdgts);
      setSavingsGoals(goals);
      setInvestments(invs);
      setLogs(activityLogs);
    } catch (err: any) {
      showToast("Gagal memuat naik data dari pelayan: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [session, showToast]);

  // Load data on session state change
  useEffect(() => {
    if (session) {
      fetchAllData();
    }
  }, [session, fetchAllData]);

  // --- AUTH ACTIONS ---
  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setView("dashboard");
  };

  const handleLogout = () => {
    api.logout();
    setSession(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kitapunya_session");
      localStorage.removeItem("kitapunya_active_userid");
    }
    showToast("Keluar dari profil berhasil.", "info");
  };

  // --- ACC MUTATORS ---
  const handleCreateAccount = async (acc: { name: string; type: string; balance: number; color: string }) => {
    try {
      await api.createAccount(acc);
      await fetchAllData();
      showToast(`Akaun "${acc.name}" berjaya disimpan!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateAccount = async (id: string, acc: any) => {
    try {
      await api.updateAccount(id, acc);
      await fetchAllData();
      showToast("Maklumat akaun dikemaskini!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await api.deleteAccount(id);
      await fetchAllData();
      showToast("Akaun berjaya dipadamkan.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleTransfer = async (from: string, to: string, amount: number, desc: string) => {
    try {
      await api.createTransaction({
        accountId: from,
        toAccountId: to,
        amount,
        type: "transfer",
        description: desc,
        date: new Date().toISOString().substring(0, 10),
        categoryId: null,
        receiptImageUrl: null
      });
      await fetchAllData();
      showToast("Pindahan baki berjaya diproses!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // --- TX MUTATORS ---
  const handleCreateTransaction = async (tx: any) => {
    try {
      await api.createTransaction(tx);
      await fetchAllData();
      showToast("Transaksi kewangan berjaya direkodkan!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      await fetchAllData();
      showToast("Transaksi dikeluarkan dan baki akaun dikemaskini.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // --- CATEGORY MUTATORS ---
  const handleCreateCategory = async (cat: any) => {
    try {
      await api.createCategory(cat);
      await fetchAllData();
      showToast(`Kategori "${cat.name}" berjaya ditambah!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateCategory = async (id: string, cat: any) => {
    try {
      await api.updateCategory(id, cat);
      await fetchAllData();
      showToast("Kategori berjaya dikemaskini.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      await fetchAllData();
      showToast("Kategori berjaya dipadamkan.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // --- BUDGET MUTATORS ---
  const handleSetBudget = async (categoryId: string, amount: number, month: string) => {
    try {
      await api.createOrUpdateBudget({ categoryId, amount, month });
      await fetchAllData();
      showToast("Had siling bajet dikemaskini!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // --- GOAL MUTATORS ---
  const handleCreateGoal = async (goal: any) => {
    try {
      await api.createSavingsGoal(goal);
      await fetchAllData();
      showToast(`Sasaran "${goal.name}" berjaya ditetapkan!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateGoal = async (id: string, goal: any) => {
    try {
      await api.updateSavingsGoal(id, goal);
      await fetchAllData();
      showToast("Progress sasaran simpanan dikemaskini!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await api.deleteSavingsGoal(id);
      await fetchAllData();
      showToast("Matlamat simpanan dipadam.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // --- INVESTMENT MUTATORS ---
  const handleCreateInvestment = async (inv: any) => {
    try {
      await api.createInvestment(inv);
      await fetchAllData();
      showToast(`Aset pelaburan "${inv.name}" disimpan!`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateInvestment = async (id: string, inv: any) => {
    try {
      await api.updateInvestment(id, inv);
      await fetchAllData();
      showToast("Nilai pasaran portfolio dikemaskini!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await api.deleteInvestment(id);
      await fetchAllData();
      showToast("Rekod pelaburan dikeluarkan.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRefreshPrices = async () => {
    setLoading(true);
    try {
      const res = await api.refreshInvestments();
      await fetchAllData();
      showToast(`Berjaya mengemas kini harga pasaran bagi ${res.updatedCount} aset aktif melalui AI Gemini!`, "success");
    } catch (err: any) {
      showToast("Gagal mengemas kini harga pelaburan: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  // Render Authentication if session missing
  if (!session) {
    return (
      <>
        <AuthView onAuthSuccess={handleAuthSuccess} showToast={showToast} />
        {/* Render interactive toast */}
        {toast && (
          <div
            id="toast"
            className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-semibold max-w-sm transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400"
                : toast.type === "error"
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-400"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-400"
            }`}
          >
            {toast.message}
          </div>
        )}
      </>
    );
  }

  // Render Main Layout Dashboard Shell with Top Bar and Bottom Navigation
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-3.5 flex items-center justify-between">
        {/* Left: Ganti Profil */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} className="text-zinc-400" />
          <span>Ganti Profil</span>
        </button>

        {/* Right: Badge + Dark Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Profile Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold shadow-sm ${
            session.fullName === "Nibras"
              ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-400"
              : session.fullName === "Zenita"
              ? "bg-pink-50/80 dark:bg-pink-950/20 border-pink-200/60 dark:border-pink-900/40 text-pink-700 dark:text-pink-400"
              : "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
          }`}>
            {session.fullName === "Uang Bersama" ? <Users size={13} /> : <User size={13} />}
            <span>{session.fullName}</span>
            {session.fullName !== "Uang Bersama" && (
              <span className="text-[9px] font-black uppercase bg-zinc-200/50 dark:bg-zinc-800/60 px-1 py-0.5 rounded ml-1 tracking-wider text-zinc-500">
                Read-Only Shared
              </span>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-zinc-500 transition-all cursor-pointer"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Panel Content Box */}
      <main id="app-main-content" className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-28 relative">
        {loading && (
          <div className="absolute top-4 right-8 z-30 flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/20">
            <Loader2 className="animate-spin" size={14} />
            Mengemaskini data...
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          {/* Dashboard Route Router */}
          {currentView === "dashboard" && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              investments={investments}
              setView={setView}
              openAddTxModal={() => setView("transactions")}
            />
          )}

          {currentView === "accounts" && (
            <AccountsView
              accounts={accounts}
              onCreateAccount={handleCreateAccount}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransfer={handleTransfer}
            />
          )}

          {currentView === "transactions" && (
            <TransactionsView
              accounts={accounts}
              categories={categories}
              transactions={transactions}
              onCreateTransaction={handleCreateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              showToast={showToast}
              autoOpenOcr={autoOpenOcr}
              onOcrClosed={() => setAutoOpenOcr(false)}
            />
          )}

          {currentView === "categories" && (
            <CategoriesView
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {currentView === "budgets" && (
            <BudgetsView
              categories={categories}
              budgets={budgets}
              transactions={transactions}
              onSetBudget={handleSetBudget}
            />
          )}

          {currentView === "savings" && (
            <SavingsView
              goals={savingsGoals}
              onCreateGoal={handleCreateGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {currentView === "investments" && (
            <InvestmentsView
              investments={investments}
              accounts={accounts}
              session={session}
              onCreateInvestment={handleCreateInvestment}
              onUpdateInvestment={handleUpdateInvestment}
              onDeleteInvestment={handleDeleteInvestment}
              onRefreshPrices={handleRefreshPrices}
            />
          )}

          {currentView === "gallery" && (
            <GalleryView
              transactions={transactions}
              categories={categories}
            />
          )}

          {currentView === "admin" && (
            <AdminView
              logs={logs}
              showToast={showToast}
            />
          )}

          {/* More Options Custom Grid View */}
          {currentView === "menu" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                  Menu Tambahan KitaPunya
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Urus akaun, kategori, had siling bajet, pelaburan, dan lihat log aktiviti profil anda.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Accounts Card */}
                <button
                  onClick={() => setView("accounts")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <CreditCard size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Akaun Kewangan</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Urus baki & pindahan</span>
                </button>

                {/* Budgets Card */}
                <button
                  onClick={() => setView("budgets")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-pink-50 dark:bg-pink-950/20 text-pink-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <PieChart size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Had Siling Bajet</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Sediakan had perbelanjaan</span>
                </button>

                {/* Categories Card */}
                <button
                  onClick={() => setView("categories")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Tag size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Kategori Transaksi</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Urus tag & ikon warna</span>
                </button>

                {/* Investments Card */}
                <button
                  onClick={() => setView("investments")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Aset Pelaburan</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Prestasi saham & logam</span>
                </button>

                {/* Gallery Card */}
                <button
                  onClick={() => setView("gallery")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Image size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Galeri Resit</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Arkib resit perbelanjaan</span>
                </button>

                {/* Logs Card */}
                <button
                  onClick={() => setView("admin")}
                  className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm transition-all group cursor-pointer text-center"
                >
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <History size={24} />
                  </div>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Log Aktiviti</span>
                  <span className="text-[10px] text-zinc-400 mt-1">Jejak log sistem & admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800/80 px-2 py-2 flex items-center justify-around shadow-lg">
        {/* Item 1: Dashboard */}
        <button
          onClick={() => {
            setView("dashboard");
            setAutoOpenOcr(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            currentView === "dashboard"
              ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <LayoutDashboard size={20} className="mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        {/* Item 2: Transaksi */}
        <button
          onClick={() => {
            setView("transactions");
            setAutoOpenOcr(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            currentView === "transactions" && !autoOpenOcr
              ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <ArrowUpDown size={20} className="mb-0.5" />
          <span className="text-[10px]">Transaksi</span>
        </button>

        {/* Item 3: Scan */}
        <button
          onClick={() => {
            console.log("SCAN CLICKED");
            setView("transactions");
            setAutoOpenOcr(true);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            currentView === "transactions" && autoOpenOcr
              ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <Camera size={20} className="mb-0.5" />
          <span className="text-[10px]">Scan</span>
        </button>

        {/* Item 4: Target */}
        <button
          onClick={() => setView("savings")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            currentView === "savings"
              ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <Target size={20} className="mb-0.5" />
          <span className="text-[10px]">Target</span>
        </button>

        {/* Item 5: Menu */}
        <button
          onClick={() => setView("menu")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all cursor-pointer ${
            ["menu", "accounts", "categories", "budgets", "investments", "admin"].includes(currentView)
              ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium"
          }`}
        >
          <Menu size={20} className="mb-0.5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* Modern custom toast notification dialog overlay */}
      {toast && (
        <div
          id="toast"
          className={`fixed bottom-20 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold max-w-md animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400"
              : toast.type === "error"
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-400"
              : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-400"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
