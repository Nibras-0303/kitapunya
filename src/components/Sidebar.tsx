import React, { useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tag,
  PieChart,
  Target,
  TrendingUp,
  Image as ImageIcon,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Wallet
} from "lucide-react";
import { AuthSession } from "../types.js";
import { ThemeToggle } from "./ThemeToggle.jsx";

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  session: AuthSession | null;
  handleLogout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  session,
  handleLogout,
  theme,
  toggleTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transaksi", icon: ArrowLeftRight },
    { id: "savings", label: "Target Tabungan", icon: Target },
    { id: "scan", label: "Scan Nota", icon: ImageIcon },
  ];

  // Admin section menu item
  const isAdmin = false;

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header id="mobile-header" className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 rounded-xl text-white">
            <Wallet size={20} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
            KitaPunya
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            id="mobile-menu-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          id="mobile-drawer-backdrop"
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 py-6 px-4 overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-500/10">
              <Wallet size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
                KitaPunya
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Pintar Urus Wang
              </p>
            </div>
          </div>

          {/* User Profile Info Card */}
          {session && (
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/20">
                  {session.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate">
                    {session.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {session.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-2">
              Menu Utama
            </span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-white" : "text-zinc-400 dark:text-zinc-500"} />
                  {item.label}
                </button>
              );
            })}

            {/* Admin Section */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="px-3 text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider block mb-2">
                  Admin Panel
                </span>
                <button
                  id="nav-link-admin"
                  onClick={() => handleNavClick("admin")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    currentView === "admin"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/15"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-200"
                  }`}
                >
                  <ShieldAlert size={18} className={currentView === "admin" ? "text-white" : "text-red-500"} />
                  Kelola Admin
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="hidden md:flex items-center justify-between px-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Tukar Tema:</span>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>

          <button
            id="nav-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
          >
            <LogOut size={18} />
            Log Keluar
          </button>
        </div>
      </aside>
    </>
  );
};
